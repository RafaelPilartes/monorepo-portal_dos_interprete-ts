import { readdirSync } from 'node:fs'

// The last migration this build carries (api.md §3): MIGRATION_IN_BUILD when set, else the value
// tsup writes into the bundle at build time, else (tests, tsx) the last file of
// packages/db/migrations, four levels up from src/lib.
declare const __MIGRATION_IN_BUILD__: string | null | undefined

const MIGRATION = /^\d{4}-[a-z0-9-]+\.sql$/

export function lastMigration(names: readonly string[]): string | null {
  const migrations = names.filter((name) => MIGRATION.test(name)).sort()
  return migrations.at(-1) ?? null
}

export function resolveMigrationInBuild(fromEnv: string | undefined): string | null {
  if (fromEnv) return fromEnv
  if (typeof __MIGRATION_IN_BUILD__ !== 'undefined') return __MIGRATION_IN_BUILD__
  try {
    return lastMigration(readdirSync(new URL('../../../../packages/db/migrations/', import.meta.url)))
  } catch {
    return null
  }
}
