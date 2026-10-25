import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The running local Supabase and the test credentials, read when the tests run. The credentials
// file is written by `pnpm db:bootstrap-admin` and git-ignored; nothing here prints it.

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export interface LocalSupabase {
  API_URL: string
  DB_URL: string
  ANON_KEY: string
  SERVICE_ROLE_KEY: string
  MAILPIT_URL: string
}

let cached: LocalSupabase | null | undefined

/** The local stack, or null when it is not running (specs that need it then fail clearly). */
export function localSupabase(): LocalSupabase | null {
  if (cached !== undefined) return cached
  try {
    cached = JSON.parse(
      execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
    ) as LocalSupabase
  } catch {
    cached = null
  }
  return cached
}

export function requireLocalSupabase(): LocalSupabase {
  const local = localSupabase()
  if (!local) throw new Error('The local database is not running: pnpm db:up && pnpm db:bootstrap-admin admin@portal.local')
  return local
}

export const ADMIN_EMAIL = 'admin@portal.local'

export function adminCredentials(): { email: string; password: string } {
  const file = path.join(repoRoot, 'docs/technical/TEST-CREDENTIALS.md')
  if (!existsSync(file)) throw new Error('Missing docs/technical/TEST-CREDENTIALS.md: run pnpm db:bootstrap-admin admin@portal.local')
  const text = readFileSync(file, 'utf8')
  const email = /^- email: (.+)$/m.exec(text)?.[1]?.trim()
  const password = /^- password: (.+)$/m.exec(text)?.[1]?.trim()
  if (!email || !password) throw new Error('docs/technical/TEST-CREDENTIALS.md has no super_admin credentials')
  return { email, password }
}

export const API_URL = 'http://localhost:3000'
export const ADMIN_URL = process.env.ADMIN_URL ?? 'http://localhost:5173'
export const ADMIN_STATE = path.join(repoRoot, 'tests/e2e/test-results/admin-state.json')
