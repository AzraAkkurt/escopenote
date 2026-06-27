import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: path.join(__dirname, 'src/renderer'),
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.join(__dirname, 'shared'),
      '@renderer': path.join(__dirname, 'src/renderer'),
    },
  },
  base: './',
  build: {
    outDir: path.join(__dirname, 'out/renderer'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
