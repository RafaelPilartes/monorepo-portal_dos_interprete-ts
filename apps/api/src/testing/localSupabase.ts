import { execFileSync } from 'node:child_process'

// Connection details of the running local Supabase, read once from `supabase status`. These are
// the CLI's fixed local development values, never project secrets.
interface LocalStatus {
  API_URL: string
  DB_URL: string
  SERVICE_ROLE_KEY: string
  ANON_KEY: string
  MAILPIT_URL: string
}

function readStatus(): LocalStatus {
  try {
    const output = execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
      cwd: new URL('../../../../', import.meta.url),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return JSON.parse(output) as LocalStatus
  } catch {
    throw new Error('The local database is not running: start it with `pnpm db:up` (or run `pnpm db:verify`).')
  }
}

export const local: LocalStatus = readStatus()
