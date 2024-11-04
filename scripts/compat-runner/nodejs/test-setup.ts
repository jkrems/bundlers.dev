import { expect } from 'expect';

Object.assign(globalThis, {
  __IS_NODEJS__: true,
  test: async (description: string, fn: () => Promise<void>) => {
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
  },
  expect,
});
