import { expect } from 'expect';

type TestFunction = () => void | Promise<void>;

const tests = new Map<string, TestFunction>();

async function runTests() {
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
  __IS_BUN__: true,
  __IS_NODEJS__: false,
  test: async (description: string, fn: () => Promise<void>) => {
    if (tests.has(description)) {
      throw new Error(`Duplicate test with description: ${description}`);
    }
    tests.set(description, fn);

    queueMicrotask(runTests);
  },
  expect,
});
