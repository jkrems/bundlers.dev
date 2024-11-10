import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      'node_modules',
      'compat-suite',
      'scripts/compat-runner/*/node_modules',
    ],
  },
});
