import { expect } from '../../../.tmp/expect-bundle.js';

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
  Deno.exit(0);
}

Object.assign(globalThis, {
  test: async (description: string, fn: () => Promise<void>) => {
    if (tests.has(description)) {
      throw new Error(`Duplicate test with description: ${description}`);
    }
    tests.set(description, fn);
  },
  expect,
});

await import(`../../../${Deno.args[0]}`).then(() => runTests());
