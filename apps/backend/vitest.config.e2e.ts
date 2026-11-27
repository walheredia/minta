import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // All e2e files share one real MySQL database; running them in parallel
    // makes their broad cleanup deletes deadlock with each other's transactions.
    fileParallelism: false,
  },
});
