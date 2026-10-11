import { defineConfig } from 'vite';

// Content scripts run as classic scripts (no ES module support in MV3), so we build
// this entry as a single self-contained IIFE named content.js.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2022',
    sourcemap: false,
    minify: false,
    lib: {
      entry: 'src/content/index.ts',
      name: 'SmartFillContent',
      formats: ['iife'],
      fileName: () => 'content.js'
    }
  }
});
