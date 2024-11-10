import { expect } from 'expect';

type TestFunction = () => void | Promise<void>;

const tests = new Map<string, TestFunction>();

let ranTests = false;

async function runTests() {
  if (ranTests) {
    return;
  }
  ranTests = true;

  for (const [description, fn] of tests) {
    let error = null;
    try {
      await fn();
    } catch (e) {
      error = {
        message: `${e instanceof Error ? e.message : e}`,
        stack: e instanceof Error ? e.stack : null,
      };
    }
    console.log(JSON.stringify({ description, error }));
  }
  process.exit(0);
}

Object.assign(globalThis, {
  test: async (description: string, fn: () => Promise<void>) => {
    if (tests.has(description)) {
      throw new Error(`Duplicate test with description: ${description}`);
    }
    if (ranTests) {
      throw new Error(`Non-synchronous test registration for ${description}`);
    }
    tests.set(description, fn);

    queueMicrotask(runTests);
  },
  expect,
});

setTimeout(runTests, 250);
