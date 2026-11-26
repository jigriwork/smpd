// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://smpd.in',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  // three.js is lazy-loaded after first paint; its chunk is expected to be large.
  vite: { build: { chunkSizeWarningLimit: 700 } },
});
