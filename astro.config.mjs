import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://jkrems.dev',
  base: 'bundlers.dev',
  integrations: [mdx()],
});
