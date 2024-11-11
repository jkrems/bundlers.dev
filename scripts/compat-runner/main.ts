import { glob, stat } from 'node:fs/promises';
import { join } from 'node:path';
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
