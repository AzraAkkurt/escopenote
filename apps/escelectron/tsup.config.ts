import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/main/index.ts'],
    outDir: 'out/main',
    format: ['cjs'],
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    clean: true,
    sourcemap: true,
  },
  {
    entry: ['src/preload/index.ts'],
    outDir: 'out/preload',
    format: ['cjs'],
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    clean: false,
    sourcemap: true,
  },
]);
