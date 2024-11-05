if (__IS_NODEJS__) {
  // TODO: Split these tests and use a convention like `--{env.id}`?
  test('NOTE: Using the node:worker_threads API', async () => {
    const { Worker } = await import('node:worker_threads');
    const worker = new Worker(
      new URL('./testdata/worker--nodejs.js', import.meta.url),
    );
    try {
      const n = 42;
      const resp = await Promise.race([
        new Promise((resolve, reject) => {
          worker.once('error', reject);
          worker.once('message', resolve);

          worker.postMessage(n);
        }),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('No response from worker after timeout'));
          }, 5000);
        }),
      ]);
      expect(resp).toBe(21);
    } finally {
      worker.terminate();
    }
  });
} else {
  test('import.meta.url can load a Worker', async () => {
    const worker = new Worker(
      new URL('./testdata/worker.js', import.meta.url),
      { type: 'module' },
    );
    const n = 42;
    try {
      const resp = await Promise.race([
        new Promise((resolve, reject) => {
          worker.onerror = reject;
          worker.onmessageerror = reject;
          worker.onmessage = ({ data }) => resolve(data);

          worker.postMessage(n);
        }),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('No response from worker after timeout'));
          }, 5000);
        }),
      ]);
      expect(resp).toBe(21);
    } finally {
      worker.terminate();
    }
  });
}
