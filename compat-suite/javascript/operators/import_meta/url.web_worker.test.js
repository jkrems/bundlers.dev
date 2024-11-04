test('import.meta.url can load a Worker', async () => {
  const worker = new Worker(new URL('./testdata/worker.js', import.meta.url));
  const n = 42;
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
      }, 2000);
    }),
  ]);
  expect(resp).toBe(21);
});
