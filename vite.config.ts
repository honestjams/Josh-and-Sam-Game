import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Vite config for the Mycelia Hollow vertical slice.
// Static build target — output in `dist/`, deployable to Vercel or Netlify.
//
// `SINGLE_FILE=1 npm run build` inlines everything into one self-contained
// `dist/index.html` (no external requests) — used to publish a portable,
// hostable build. The normal build stays multi-file.
const singleFile = process.env.SINGLE_FILE === '1';

export default defineConfig({
  base: './',
  plugins: singleFile ? [viteSingleFile()] : [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: !singleFile,
    // In single-file mode inline ALL art as data URIs so the one HTML is fully
    // self-contained (the deployed artifact then shows real art, not fetches).
    assetsInlineLimit: singleFile ? Number.MAX_SAFE_INTEGER : 4096,
  },
  server: {
    host: true,
    port: 5173,
  },
});
