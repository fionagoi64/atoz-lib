import 'dotenv/config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
    },
  },
});
