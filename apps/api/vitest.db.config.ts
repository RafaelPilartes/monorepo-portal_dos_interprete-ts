import { defineConfig } from 'vitest/config'

// Tests against the running local Supabase (foundation.md §G item 7). The connection details come
// from `supabase status` (src/testing/localSupabase.ts); without a running instance they fail.
export default defineConfig({
  test: {
    include: ['src/**/*.db.test.ts'],
    setupFiles: ['src/testing/localSupabase.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
  },
})
