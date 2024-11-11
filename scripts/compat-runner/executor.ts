import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { relative, dirname, basename } from 'node:path';

import type { Platform, PlatformId } from './compat_data_schema';

const execFile = promisify(execFileCb);

export interface TestResult {
  description: string;
  error: null | {
    message: string;
    stack?: string;
  };
}

export interface PlatformInfo<T extends PlatformId> extends Platform<T> {
  version: string;
}

export interface TestSuiteResult<T extends PlatformId> {
  platform: PlatformInfo<T>;
  filename: string;
  compatGroup: string;
  compatSubpath: string[];
  notes: string[];
  flags: string[];
  ok: boolean;
  partial: boolean;
  pass: number;
  fail: number;
  total: number;
  results: TestResult[];
}

export abstract class TestCaseExecutor<T extends PlatformId> {
  abstract run(
    filenames: string[],
    cwd: string,
    isDebug: boolean,
  ): Promise<Map<string, TestSuiteResult<T>>>;
}

function parseSubPath(base: string): string[] {
  // Remove ~env suffix first.
  base = base.replace(/(?:~\w+)+$/, '');
  if (base === '_') return [];
  return base.split('.');
}

export function toTestSuiteResult<T extends PlatformId>(
  platform: PlatformInfo<T>,
  filename: string,
  results: TestResult[],
): TestSuiteResult<T> {
  let pass = 0;
  let fail = 0;
  let total = 0;
  const failureNotes: string[] = [];
  const notes = new Set<string>();
  for (const result of results) {
    if (result.description.startsWith('NOTE: ')) {
      if (!result.error) {
        ++pass;
        ++total;
        notes.add(result.description.slice('NOTE: '.length));
      }
      continue;
    } else if (result.description.startsWith('NOTE/FAIL: ')) {
      if (result.error) {
        notes.add(result.description.slice('NOTE/FAIL: '.length));
      }
      continue;
    }
    if (result.error) {
      failureNotes.push(result.description);
      ++fail;
      ++total;
    } else {
      ++pass;
      ++total;
    }
  }
  const compatGroup = dirname(relative('compat-suite', filename));
  const compatSubpath = parseSubPath(basename(filename, '.test.js'));
  const partial = total > 0 && fail > 0 && pass > 0;
  if (partial) {
    for (const failureNote of failureNotes) {
      notes.add(`Fails: ${failureNote}`);
    }
  }
  if (partial && !notes.size) {
    throw new Error(`Cannot generate partial success without notes`);
  }
  return {
    platform: platform,
    filename,
    compatGroup,
    compatSubpath,
    notes: [...notes],
    flags: [],
    ok: total > 0 && fail === 0,
    partial,
    pass,
    fail,
    total,
    results,
  };
}

export abstract class ExecTestCaseExecutor<
  T extends PlatformId,
> extends TestCaseExecutor<T> {
  protected abstract getExecPath(): string;
  protected abstract getExecFlags(): string[];
  protected abstract getPlatformInfo(): Promise<PlatformInfo<T>>;

  async #runTestCase(filename: string, cwd: string): Promise<TestResult[]> {
    try {
      const execPath = this.getExecPath();
      const execFlags = [...this.getExecFlags(), filename];
      console.info('Running: %s %s', execPath, execFlags.join(' '));
      const { stdout, stderr } = await execFile(execPath, execFlags, {
        cwd,
      });
      if (stderr) {
        console.error('While running %s:\n  %s', filename, stderr);
      }
      const lines = stdout
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as TestResult);
      return lines;
    } catch (e) {
      return [
        {
          description: 'Run test suite',
          error: {
            message: `Test suite failed to run: ${e instanceof Error ? e.message : e}`,
          },
        },
      ];
    }
  }

  async run(
    filenames: string[],
    cwd: string,
    isDebug: boolean,
  ): Promise<Map<string, TestSuiteResult<T>>> {
    if (isDebug) {
      throw new Error(`--debug is not supported for this platform yet`);
    }
    const env = await this.getPlatformInfo();

    const suites = new Map<string, TestSuiteResult<T>>();
    for (const filename of filenames) {
      const results = await this.#runTestCase(filename, cwd);
      suites.set(filename, toTestSuiteResult(env, filename, results));
    }
    return suites;
  }
}
