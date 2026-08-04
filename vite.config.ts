import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Vite config for the Mycelia Hollow vertical slice.
// Static build target — output in `dist/`, deployable to Vercel or Netlify.
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
