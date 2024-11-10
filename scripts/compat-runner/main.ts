import { glob, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { BunTestCaseExecutor } from './bun/executor.ts';
import { DenoTestCaseExecutor } from './deno/executor.ts';
import { NodejsTestCaseExecutor } from './nodejs/executor.ts';
import { EsbuildTestCaseExecutor } from './esbuild/executor.ts';
import type { TestCaseExecutor, TestSuiteResult } from './executor.ts';
import { WebpackTestCaseExecutor } from './webpack/executor.ts';
import { ViteTestCaseExecutor } from './vite/executor.ts';
import { RspackTestCaseExecutor } from './rspack/executor.ts';
import { RsbuildTestCaseExecutor } from './rsbuild/executor.ts';

async function getTestSuites(
  globs: string[],
  { cwd, envId }: { cwd: string; envId: string },
) {
  const suites: string[] = [];
  const envSuffix = `~${envId}.test.js`;

  const matches = await glob(globs, {
    cwd,
  });
  for await (const match of matches) {
    if (/~\w+\.test\./.test(match)) {
      continue;
    }
    const envMatch = match.replace(/\.test\.js$/, envSuffix);
    try {
      await stat(join(cwd, envMatch));
      suites.push(envMatch);
      continue;
    } catch (e) {
      if ((e as any).code !== 'ENOENT') {
        throw e;
      }
    }
    suites.push(match);
  }

  return suites;
}

function findRootNode(filename: string, compatData: object) {
  while (!('__compat' in compatData)) {
    const keys = Object.keys(compatData);
    if (keys.length !== 1) {
      throw new Error(
        'Expected unambiguous root in compat data file ' + filename,
      );
    }
    compatData = (compatData as any)[keys[0]];
  }
  return compatData;
}

interface SupportStatement {
  version_added: string | null | boolean;
  version_removed?: string | null | boolean;
  partial_implementation?: boolean;
  notes?: string | string[];
}

interface CompatNode {
  __compat: {
    description: string;
    support: {
      [id: string]: SupportStatement;
    };
  };
}

function assertCompatNode(
  node: unknown,
  filename: string,
): asserts node is CompatNode {
  if (!node || typeof node !== 'object' || !('__compat' in node)) {
    throw new Error('Expect __compat node for ' + filename);
  }
}

function summarizeSupport(support: SupportStatement): string {
  return `${support.version_added}`;
}

interface PlatformInfo {
  id: string;
  type: 'bundler' | 'runtime';
  Executor: { new (): TestCaseExecutor };
}

const PLATFORMS = new Map<string, PlatformInfo>([
  ['bun', { id: 'bun', type: 'runtime', Executor: BunTestCaseExecutor }],
  ['deno', { id: 'deno', type: 'runtime', Executor: DenoTestCaseExecutor }],
  [
    'esbuild',
    { id: 'esbuild', type: 'bundler', Executor: EsbuildTestCaseExecutor },
  ],
  [
    'nodejs',
    { id: 'nodejs', type: 'runtime', Executor: NodejsTestCaseExecutor },
  ],
  [
    'rsbuild',
    { id: 'rsbuild', type: 'bundler', Executor: RsbuildTestCaseExecutor },
  ],
  [
    'rspack',
    { id: 'rspack', type: 'bundler', Executor: RspackTestCaseExecutor },
  ],
  ['vite', { id: 'vite', type: 'bundler', Executor: ViteTestCaseExecutor }],
  [
    'webpack',
    { id: 'webpack', type: 'bundler', Executor: WebpackTestCaseExecutor },
  ],
]);

function createExecutor(envId: string) {
  const platform = PLATFORMS.get(envId);

  if (!platform) {
    throw new Error(`No executor for '${envId}'`);
  }

  return new platform.Executor();
}

async function runForEnvId(
  envId: string,
  globs: string[],
  { cwd }: { cwd: string },
): Promise<Map<string, TestSuiteResult>> {
  const executor = createExecutor(envId);

  const testSuites = await getTestSuites(globs, { cwd, envId });

  const results = await executor.run(testSuites, process.cwd());

  return results;
}

async function applyTestResults(
  results: Map<string, TestSuiteResult>,
  { cwd, isDryRun }: { cwd: string; isDryRun: boolean },
) {
  for (const result of results.values()) {
    const compatDataPath = join(
      cwd,
      `src/content/bundler-compat-data/${result.compatGroup}.json`,
    );
    const compatData = JSON.parse(await readFile(compatDataPath, 'utf8'));
    let node = findRootNode(compatDataPath, compatData);
    for (const subPath of result.compatSubpath) {
      node = (node as any)[subPath];
    }
    assertCompatNode(node, result.filename);

    if (!node.__compat.support[result.env.id]) {
      node.__compat.support[result.env.id] = {
        version_added: null,
      };
    }
    const currentSupport = node.__compat.support[result.env.id];
    const prevSummary = isDryRun ? summarizeSupport(currentSupport) : '';

    if (currentSupport.version_added === null) {
      currentSupport.version_added = result.ok
        ? `<${result.env.version}`
        : false;
    } else if (currentSupport.version_added === false) {
      currentSupport.version_added = result.ok ? result.env.version : false;
    } else if (currentSupport.version_added === true) {
      currentSupport.version_added = `<${result.env.version}`;
      if (!result.ok) {
        currentSupport.version_removed = result.env.version;
      }
    }

    currentSupport.notes = result.notes.length ? result.notes : undefined;
    const newSummary = isDryRun ? summarizeSupport(currentSupport) : '';

    if (isDryRun && newSummary !== prevSummary) {
      console.log(
        '%s: %s -> %s',
        node.__compat.description,
        prevSummary,
        newSummary,
      );
    } else {
      await writeFile(
        compatDataPath,
        JSON.stringify(compatData, null, 2) + '\n',
      );
    }
  }
}

const DEFAULT_ENV_IDS = ['nodejs'];

function parseEnvFilter(envFilter: string[]) {
  if (envFilter.length === 0) {
    return DEFAULT_ENV_IDS;
  }

  return Array.from(
    new Set(
      envFilter.flatMap((filter) => {
        if (filter === '*') {
          return [...PLATFORMS.keys()];
        } else if (filter === 'bundler' || filter === 'runtime') {
          return [...PLATFORMS.keys()].filter((id) => {
            return PLATFORMS.get(id)?.type === filter;
          });
        }
        return filter.split(',');
      }),
    ),
  );
}

async function main(argv: string[]) {
  const globs = argv.filter((arg) => !arg.startsWith('-'));
  if (globs.length === 0) {
    throw new Error('Expected test file patterns');
  }

  const isDryRun = argv.includes('--dry');
  const envIdFilter = argv
    .filter((arg) => arg.startsWith('--env='))
    .map((arg) => arg.slice('--env='.length));
  const envIds = parseEnvFilter(envIdFilter);

  const cwd = process.cwd();

  const resultsByEnv = await Promise.all(
    envIds.map((envId) => runForEnvId(envId, globs, { cwd })),
  );

  for (const results of resultsByEnv) {
    await applyTestResults(results, { cwd, isDryRun });
  }
}

await main(process.argv.slice(2));

export {};
