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

export const REQUESTER_URL = process.env.REQUESTER_URL ?? 'http://localhost:5171'
export const INTERPRETER_URL = process.env.INTERPRETER_URL ?? 'http://localhost:5172'
/** The session of an account with both roles, shared by requester-web and interpreter-web (cookies of localhost). */
export const PANEL_STATE = path.join(repoRoot, 'tests/e2e/test-results/panel-state.json')

/** An account created confirmed through the local Auth admin API (test setup only). */
export async function createConfirmedUser(fullName: string): Promise<{ id: string; email: string; password: string; accessToken: string }> {
  const local = requireLocalSupabase()
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.ao`
  const password = `Senha${Math.random().toString(36).slice(2, 10)}9`
  const admin = { authorization: `Bearer ${local.SERVICE_ROLE_KEY}`, apikey: local.SERVICE_ROLE_KEY, 'content-type': 'application/json' }
  const created = await fetch(`${local.API_URL}/auth/v1/admin/users`, {
    method: 'POST', headers: admin, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName } }),
  })
  if (!created.ok) throw new Error(`create user: ${created.status}`)
  const { id } = (await created.json()) as { id: string }
  const session = await fetch(`${local.API_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: local.ANON_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ email, password }),
  })
  if (!session.ok) throw new Error(`sign in: ${session.status}`)
  const { access_token: accessToken } = (await session.json()) as { access_token: string }
  return { id, email, password, accessToken }
}

/** Calls the API as an account (test setup: the same routes the screens call). */
export async function apiAs<T>(accessToken: string, method: string, pathName: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${pathName}`, {
    method,
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const payload = (await response.json().catch(() => ({}))) as T
  if (!response.ok) throw new Error(`${method} ${pathName}: ${response.status} ${JSON.stringify(payload)}`)
  return payload
}

/** The newest email Mailpit received for an address, with its text body. */
export async function latestEmail(to: string, subjectPattern?: RegExp): Promise<{ subject: string; text: string }> {
  const local = requireLocalSupabase()
  for (let attempt = 0; attempt < 60; attempt++) {
    const search = await fetch(`${local.MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)
    const { messages } = (await search.json()) as { messages: { ID: string; Subject: string }[] }
    const found = messages.find((message) => !subjectPattern || subjectPattern.test(message.Subject))
    if (found) {
      const message = (await (await fetch(`${local.MAILPIT_URL}/api/v1/message/${found.ID}`)).json()) as { Subject: string; Text: string; HTML: string }
      return { subject: message.Subject, text: `${message.Text}\n${message.HTML}` }
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`no email for ${to}`)
}

export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:5170'

/**
 * Test setup only: one SQL statement on the local database, as its owner (psql inside the database
 * container, like packages/db/scripts). For the states no screen creates yet (an item in use before
 * H4 lets interpreters offer services).
 */
export function sqlLocal(sql: string): string {
  const config = readFileSync(path.join(repoRoot, 'supabase/config.toml'), 'utf8')
  const projectId = /^project_id = "(.+)"$/m.exec(config)?.[1]
  if (!projectId) throw new Error('no project_id in supabase/config.toml')
  return execFileSync('docker', ['exec', '-i', `supabase_db_${projectId}`, 'psql', '-X', '-q', '-At', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' }).trim()
}
