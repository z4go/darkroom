import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// Served as a GitHub Pages project site: https://z4go.github.io/darkroom/
export default defineConfig({
  base: '/darkroom/',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
        explore: resolve(import.meta.dirname, 'app/explore/index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
});
