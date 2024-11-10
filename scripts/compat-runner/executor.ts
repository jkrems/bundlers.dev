import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { relative, dirname, basename } from 'node:path';

const execFile = promisify(execFileCb);

export interface TestResult {
  description: string;
  error: null | {
    message: string;
    stack?: string;
  };
}

export interface EnvInfo {
  id: string;
  version: string;
}

export interface TestSuiteResult {
  env: EnvInfo;
  filename: string;
  compatGroup: string;
  compatSubpath: string[];
  notes: string[];
  ok: boolean;
  partial: boolean;
  pass: number;
  fail: number;
  total: number;
  results: TestResult[];
}

export abstract class TestCaseExecutor {
  abstract run(
    filenames: string[],
    cwd: string,
  ): Promise<Map<string, TestSuiteResult>>;
}

function parseSubPath(base: string): string[] {
  // Remove ~env suffix first.
  base = base.replace(/~\w+$/, '');
  if (base === '_') return [];
  return base.split('.');
}

export function toTestSuiteResult(
  env: { id: string; version: string },
  filename: string,
  results: TestResult[],
): TestSuiteResult {
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
  return {
    env,
    filename,
    compatGroup,
    compatSubpath,
    notes: [
      ...notes,
      ...(partial ? failureNotes.map((n) => `Fails: ${n}`) : []),
    ],
    ok: total > 0 && fail === 0,
    partial,
    pass,
    fail,
    total,
    results,
  };
}

export abstract class ExecTestCaseExecutor extends TestCaseExecutor {
  protected abstract getExecPath(): string;
  protected abstract getExecFlags(): string[];
  protected abstract getEnvInfo(): Promise<EnvInfo>;

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
  ): Promise<Map<string, TestSuiteResult>> {
    const env = await this.getEnvInfo();

    const suites = new Map<string, TestSuiteResult>();
    for (const filename of filenames) {
      const results = await this.#runTestCase(filename, cwd);
      suites.set(filename, toTestSuiteResult(env, filename, results));
    }
    return suites;
  }
}
