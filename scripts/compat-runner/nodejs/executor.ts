import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { relative, dirname, basename } from 'node:path';

import { TestCaseExecutor } from '../executor.ts';

const execFile = promisify(execFileCb);

interface TestResult {
  description: string;
  error: null | {
    message: string;
    stack?: string;
  };
}

interface TestSuiteResult {
  env: {
    id: string;
    version: string;
  };
  filename: string;
  compatGroup: string;
  compatSubpath: string[];
  notes: string[];
  ok: boolean;
  pass: number;
  fail: number;
  total: number;
  results: TestResult[];
}

function parseSubPath(base: string): string[] {
  if (base === '_') return [];
  return base.split('.');
}

function toTestSuiteResult(
  env: { id: string; version: string },
  filename: string,
  results: TestResult[],
): TestSuiteResult {
  let pass = 0;
  let fail = 0;
  let total = results.length;
  const notes: string[] = [];
  for (const result of results) {
    if (result.description.startsWith('NOTE: ')) {
      if (!result.error) {
        notes.push(result.description.slice('NOTE: '.length));
      }
      continue;
    }
    if (result.error) {
      ++fail;
    } else {
      ++pass;
    }
  }
  const compatGroup = dirname(relative('compat-suite', filename));
  const compatSubpath = parseSubPath(basename(filename, '.test.js'));
  return {
    env,
    filename,
    compatGroup,
    compatSubpath,
    notes,
    ok: total > 0 && fail === 0,
    pass,
    fail,
    total,
    results,
  };
}

export class NodejsTestCaseExecutor extends TestCaseExecutor {
  async #runTestCase(filename: string, cwd: string): Promise<TestResult[]> {
    try {
      const { stdout, stderr } = await execFile(
        'node',
        [
          '--no-warnings',
          '--experimental-strip-types',
          `--import=${import.meta.resolve('./test-setup.ts')}`,
          filename,
        ],
        {
          cwd,
        },
      );
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

  async #getEnvInfo() {
    const { stdout } = await execFile('node', ['--version']);
    return {
      id: 'nodejs',
      version: stdout.trim().replace(/^v/, ''),
    };
  }

  async run(
    filenames: string[],
    cwd: string,
  ): Promise<Map<string, TestSuiteResult>> {
    const env = await this.#getEnvInfo();

    const suites = new Map<string, TestSuiteResult>();
    for (const filename of filenames) {
      const results = await this.#runTestCase(filename, cwd);
      suites.set(filename, toTestSuiteResult(env, filename, results));
    }
    return suites;
  }
}
