import { readdirSync, readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }
// The last migration of packages/db/migrations at build time: what this build expects (GET /health).
const migrations = readdirSync(new URL('../../packages/db/migrations/', import.meta.url))
  .filter((name) => /^\d{4}-[a-z0-9-]+\.sql$/.test(name))
  .sort()
const migrationInBuild = migrations.at(-1) ?? null

// The API is bundled: workspace packages (@portal-dos-interpretes/*) ship as TypeScript source,
// which Node cannot run, so they go inside the bundle; npm dependencies stay external and are
// installed by `pnpm deploy --prod` in the Docker image.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/^@portal-dos-interpretes\//],
  define: { __API_VERSION__: JSON.stringify(version), __MIGRATION_IN_BUILD__: JSON.stringify(migrationInBuild) },
})
