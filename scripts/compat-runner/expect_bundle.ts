import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { rollup } from 'rollup';
import commonJS from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

export async function ensureExpectBundle(cwd: string) {
  const expectBundlePath = join(cwd, '.tmp', 'expect-bundle.js');
  try {
    await stat(expectBundlePath);
    // return;
  } catch (e) {
    if ((e as any).code !== 'ENOENT') {
      throw e;
    }
  }

  const result = await rollup({
    context: cwd,
    input: { 'expect-bundle': './scripts/compat-runner/expect_bundle_impl.js' },
    treeshake: true,
    plugins: [
      commonJS(),
      nodeResolve({
        browser: true,
      }),
      json(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    ],
  });
  await result.write({
    dir: join(cwd, '.tmp'),
    format: 'esm',
  });
}
