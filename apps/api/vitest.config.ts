import { defineConfig } from 'vitest/config'

// Unit tests only; the tests against the local database (*.db.test.ts) run with
// vitest.db.config.ts (pnpm test:db), from packages/db/scripts/verify.sh.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], exclude: ['src/**/*.db.test.ts', 'node_modules/**'] },
})
