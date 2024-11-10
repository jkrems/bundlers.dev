test('<code>import&#8288;.meta.webpack</code> is a major version number', () => {
  expect(typeof import.meta.webpack).toBe('number');
});
