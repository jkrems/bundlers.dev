test('<code>import&#8288;.meta.env</code> is an object', () => {
  expect(typeof import.meta.env).toBe('object');
});

test('<code>import&#8288;.meta.env</code> allows dot access', () => {
  expect(import.meta.env.ENV_VALUE_NOT_SET || 42).toBe(42);
});

test('<code>import&#8288;.meta.env</code> allows bracket access', () => {
  expect(import.meta.env['ENV_VALUE_NOT_SET'] || 42).toBe(42);
});

test('<code>import&#8288;.meta.env.{DEV,PROD}</code> are mutually exclusive', () => {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;
  expect(typeof isDev).toBe('boolean');
  expect((!!isDev && !isProd) || (!isDev && !!isProd)).toBe(true);
});

test('<code>import&#8288;.meta.env.DEV</code> is a boolean', () => {
  expect(typeof import.meta.env.DEV).toBe('boolean');
});

test('<code>import&#8288;.meta.env.PROD</code> is a boolean', () => {
  expect(typeof import.meta.env.PROD).toBe('boolean');
});

test('<code>import&#8288;.meta.env.MODE</code> is a string', () => {
  expect(typeof import.meta.env.MODE).toBe('string');
});
