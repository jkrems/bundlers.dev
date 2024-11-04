import { glob, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NodejsTestCaseExecutor } from './nodejs/executor.ts';
import { BunTestCaseExecutor } from './bun/executor.ts';

async function getTestSuites(globs: string[], cwd: string) {
  const suites: string[] = [];

  const matches = await glob(globs, {
    cwd,
  });
  for await (const match of matches) {
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

function createExecutor(envId: string) {
  switch (envId) {
    case 'nodejs':
      return new NodejsTestCaseExecutor();

    case 'bun':
      return new BunTestCaseExecutor();

    default:
      throw new Error(`No executor for '${envId}'`);
  }
}

async function main(argv: string[]) {
  const globs = argv.filter((arg) => !arg.startsWith('-'));
  if (globs.length === 0) {
    throw new Error('Expected test file patterns');
  }

  const isDryRun = argv.includes('--dry');
  const envIdFilter =
    argv.find((arg) => arg.startsWith('--env='))?.slice('--env='.length) ??
    'nodejs';

  const cwd = process.cwd();

  const testSuites = await getTestSuites(globs, cwd);

  const executor = createExecutor(envIdFilter);

  const results = await executor.run(testSuites, process.cwd());

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

await main(process.argv.slice(2));

export {};
