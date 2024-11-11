import { expect } from 'expect';

/**
 * @typedef {() => void | Promise<void>} TestFunction
 */

/** @type {Map<string, TestFunction>} */
const tests = new Map();

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
  /**
   * @param {string} description
   * @param {TestFunction} fn
   */
  test: async (description, fn) => {
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
