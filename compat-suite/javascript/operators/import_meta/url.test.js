test('import.meta.url is a string', () => {
  expect(typeof import.meta.url).toBe('string');
});

test('import.meta.url has file:// protocol', async () => {
  expect(new URL(import.meta.url).protocol).toBe('file:');
});

test('import.meta.url can resolve path to static file', async () => {
  const textFileUrl = new URL('./testdata/file.txt', import.meta.url).href;
  expect(typeof textFileUrl).toBe('string');
  const contents = await fetch(textFileUrl).then((resp) => resp.text());
  expect(contents).toBe('~~ok~~\n');
});
