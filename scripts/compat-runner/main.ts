import { glob, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Range } from 'semver';
import { parseArgs } from 'node:util';

import { BunTestCaseExecutor } from './bun/executor.ts';
import { DenoTestCaseExecutor } from './deno/executor.ts';
import { NodejsTestCaseExecutor } from './nodejs/executor.ts';
import { EsbuildTestCaseExecutor } from './esbuild/executor.ts';
import type { TestCaseExecutor, TestSuiteResult } from './executor.ts';
import { WebpackTestCaseExecutor } from './webpack/executor.ts';
import { ViteTestCaseExecutor } from './vite/executor.ts';
import { RspackTestCaseExecutor } from './rspack/executor.ts';
import { RsbuildTestCaseExecutor } from './rsbuild/executor.ts';
import { PLATFORMS, type PlatformId } from './compat_data_schema.ts';
import { CompatData, CompatDataDiskSource } from './compat_data.ts';

async function getTestSuites(
  globs: string[],
  { cwd, platformId }: { cwd: string; platformId: PlatformId },
) {
  const suites: string[] = [];
  const platformSuffix = `~${platformId}.test.js`;

  const matches = await glob(globs, {
    cwd,
  });
  for await (const match of matches) {
    if (/~\w+\.test\./.test(match)) {
      continue;
    }
    const platformMatch = match.replace(/\.test\.js$/, platformSuffix);
    try {
      await stat(join(cwd, platformMatch));
      suites.push(platformMatch);
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
  return `${support.version_added}${support.partial_implementation ? ' [partial]' : ''}`;
}

const EXECUTORS: {
  [K in PlatformId]: { new (): TestCaseExecutor<K> };
} = {
  bun: BunTestCaseExecutor,
  deno: DenoTestCaseExecutor,
  esbuild: EsbuildTestCaseExecutor,
  nodejs: NodejsTestCaseExecutor,
  rsbuild: RsbuildTestCaseExecutor,
  rspack: RspackTestCaseExecutor,
  vite: ViteTestCaseExecutor,
  webpack: WebpackTestCaseExecutor,
};

function createExecutor(platformId: PlatformId) {
  const Executor = EXECUTORS[platformId];

  if (!Executor) {
    throw new Error(`No executor for '${platformId}'`);
  }

  return new Executor();
}

async function runForPlatformId(
  platformId: PlatformId,
  globs: string[],
  { cwd }: { cwd: string },
): Promise<Map<string, TestSuiteResult<PlatformId>>> {
  const executor = createExecutor(platformId);

  const testSuites = await getTestSuites(globs, {
    cwd,
    platformId,
  });

  const results = await executor.run(testSuites, process.cwd());

  return results;
}

async function applyTestResults(
  results: Map<string, TestSuiteResult<PlatformId>>,
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

    if (!node.__compat.support[result.platform.id]) {
      node.__compat.support[result.platform.id] = {
        version_added: null,
      };
    }
    const currentSupport = node.__compat.support[result.platform.id];
    const prevSummary = isDryRun ? summarizeSupport(currentSupport) : '';

    if (currentSupport.version_added === null) {
      currentSupport.version_added =
        result.ok || result.partial ? `<${result.platform.version}` : false;
      if (result.partial) {
        currentSupport.partial_implementation = true;
        if (!result.notes?.length) {
          throw new Error(
            `Partial implementation of ${node.__compat.description} in ${result.platform.id} without notes`,
          );
        }
      }
    } else if (currentSupport.version_added === false) {
      currentSupport.version_added = result.ok
        ? result.platform.version
        : false;
      if (result.partial) {
        currentSupport.version_added = result.platform.version;
        currentSupport.partial_implementation = true;
      }
    } else if (currentSupport.version_added === true) {
      currentSupport.version_added = `<${result.platform.version}`;
      if (!result.ok) {
        currentSupport.version_removed = result.platform.version;
      }
    } else if (typeof currentSupport.version_added === 'string') {
      if (
        result.ok ||
        !!result.partial === !!currentSupport.partial_implementation
      ) {
        const currentRange = new Range(currentSupport.version_added);
        const isInRange = currentRange.test(result.platform.version);
        if (
          isInRange &&
          currentSupport.version_added !== result.platform.version
        ) {
          currentSupport.version_added = `<${result.platform.version}`;
        }
      } else if (!result.ok && !result.partial) {
        throw new Error(
          `Implement: version_removed for '${node.__compat.description}'`,
        );
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

const DEFAULT_PLATFORM_IDS: PlatformId[] = ['nodejs'];

function castPlatformId(id: string): PlatformId {
  if (PLATFORMS.hasOwnProperty(id)) {
    return id as PlatformId;
  }
  throw new Error(`Unrecognized platform id '${id}'`);
}

function parsePlatformFilter(platformFilter: string[]): PlatformId[] {
  if (platformFilter.length === 0) {
    return DEFAULT_PLATFORM_IDS;
  }

  return Array.from(
    new Set(
      platformFilter.flatMap((filter) => {
        const allPlatforms: PlatformId[] = Array.from(
          Object.values(PLATFORMS),
          (p) => p.id,
        );
        if (filter === '*') {
          return allPlatforms;
        } else if (filter === 'bundler' || filter === 'runtime') {
          return allPlatforms.filter((id: PlatformId) => {
            return PLATFORMS[id].type === filter;
          });
        }
        return filter.split(',').map(castPlatformId);
      }),
    ),
  );
}

async function main(argv: string[]) {
  const {
    values: { platform: platformFilter, dry: isDryRun },
    positionals: globs,
  } = parseArgs({
    args: argv,
    options: {
      platform: {
        type: 'string',
        multiple: true,
        default: [],
      },
      dry: {
        type: 'boolean',
        default: false,
      },
    },
    allowPositionals: true,
  });

  if (globs.length === 0) {
    throw new Error('Expected test file patterns');
  }

  const platformIds = parsePlatformFilter(platformFilter);

  const cwd = process.cwd();

  const resultsByPlatform = await Promise.all(
    platformIds.map((platformId) =>
      runForPlatformId(platformId, globs, { cwd }),
    ),
  );

  const compatData = new CompatData(
    new CompatDataDiskSource({
      rootDir: join(cwd, 'src/content/bundler-compat-data'),
    }),
    isDryRun,
  );

  for (const results of resultsByPlatform) {
    for (const result of results.values()) {
      compatData.applyTestResult(result);
    }
  }

  if (isDryRun) {
    for (const change of compatData.changes()) {
      console.log(change);
    }
  } else {
    await compatData.save();
  }
}

await main(process.argv.slice(2));

export {};
