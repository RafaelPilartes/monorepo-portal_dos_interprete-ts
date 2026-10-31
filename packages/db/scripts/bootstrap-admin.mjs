// R-STF-03 — the first super_admin, the first configuration version in force and the first legal
// versions, for one environment. Idempotent: running it again changes nothing.
//
//   pnpm db:bootstrap-admin <email>
//   pnpm db:bootstrap-admin <email> --reset-local-password   (a new local password for an account
//                                                            that exists but whose password is lost)
//
// Local database only (the script refuses any other address). If the account does not exist it is
// created in the local Auth with the email confirmed and a random password, written to
// docs/technical/TEST-CREDENTIALS.md (git-ignored) for the Playwright tests. The password is never
// printed. In production the account must exist first (normal sign-up) and this script is not used
// as is: the team writes a reviewed equivalent for that environment.
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const credentialsPath = join(repoRoot, 'docs', 'technical', 'TEST-CREDENTIALS.md')
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])

function fail(message) {
  console.error(`ERRO: ${message}`)
  process.exit(1)
}

const resetPassword = process.argv.includes('--reset-local-password')
const email = (process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? '').trim().toLowerCase()
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('indica o email do primeiro super_admin: pnpm db:bootstrap-admin <email>')

let status
try {
  status = JSON.parse(
    execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
  )
} catch {
  fail('a base local não está a correr (pnpm db:up).')
}
for (const [name, value] of [['DB_URL', status.DB_URL], ['API_URL', status.API_URL]]) {
  if (!value || !LOCAL_HOSTS.has(new URL(value).hostname)) fail(`${name} não é local; este script só corre contra a base local.`)
}

function readCredentials() {
  if (!existsSync(credentialsPath)) return null
  const text = readFileSync(credentialsPath, 'utf8')
  const found = /^- email: (.+)$/m.exec(text)
  return found ? found[1].trim() : null
}

function writeCredentials(password) {
  mkdirSync(dirname(credentialsPath), { recursive: true })
  writeFileSync(
    credentialsPath,
    [
      '# Credenciais de teste (base local)',
      '',
      'Gerado por `pnpm db:bootstrap-admin`. Só para a base local; nunca versionar (está no .gitignore).',
      '',
      '## super_admin',
      `- email: ${email}`,
      `- password: ${password}`,
      '',
    ].join('\n'),
    { mode: 0o600 },
  )
}

async function authAdmin(path, init) {
  const response = await fetch(new URL(`/auth/v1/admin/${path}`, status.API_URL), {
    ...init,
    headers: { authorization: `Bearer ${status.SERVICE_ROLE_KEY}`, apikey: status.SERVICE_ROLE_KEY, 'content-type': 'application/json' },
  })
  if (!response.ok) fail(`o Auth local respondeu ${response.status} a ${path}.`)
  return response.json()
}

const client = new pg.Client({ connectionString: status.DB_URL })
await client.connect()
const report = []
try {
  let account = (await client.query('SELECT id FROM auth.users WHERE lower(email) = $1', [email])).rows[0]?.id
  if (!account) {
    const password = randomBytes(18).toString('base64url')
    const created = await authAdmin('users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }) })
    account = created.id
    writeCredentials(password)
    report.push('conta criada no Auth local; credenciais em docs/technical/TEST-CREDENTIALS.md')
  } else if (readCredentials() !== email && !resetPassword) {
    // Running again changes nothing (R-STF-03): an existing password is never replaced unasked.
    report.push('conta já existia; a palavra-passe não foi mudada e não está em docs/technical/TEST-CREDENTIALS.md (os testes Playwright precisam dela: corre outra vez com --reset-local-password)')
  } else if (readCredentials() !== email) {
    // Asked for: a new local password, so the Playwright tests can sign in.
    const password = randomBytes(18).toString('base64url')
    await authAdmin(`users/${account}`, { method: 'PUT', body: JSON.stringify({ password, email_confirm: true }) })
    writeCredentials(password)
    report.push('conta já existia; nova palavra-passe local em docs/technical/TEST-CREDENTIALS.md')
  } else {
    report.push('conta já existia; credenciais inalteradas')
  }

  await client.query('BEGIN')
  const staff = await client.query(
    `INSERT INTO identity.staff_members (account_id, level, active) VALUES ($1, 'super_admin', true)
     ON CONFLICT (account_id) DO NOTHING RETURNING account_id`,
    [account],
  )
  if (staff.rowCount === 1) {
    await client.query(
      "SELECT audit.record($1::uuid, 'system', 'staff.bootstrapped', 'staff_member', $2, NULL, jsonb_build_object('level', 'super_admin'))",
      [account, account],
    )
    report.push('super_admin criado')
  } else {
    const level = (await client.query('SELECT level, active FROM identity.staff_members WHERE account_id = $1', [account])).rows[0]
    report.push(`já era da equipa (${level.level}${level.active ? '' : ', inactivo'}); nada mudou`)
  }

  if ((await client.query("SELECT 1 FROM config.platform_versions WHERE status = 'published'")).rowCount === 0) {
    const first = (await client.query("SELECT id FROM config.platform_versions WHERE status = 'draft' ORDER BY version_number LIMIT 1")).rows[0]
    if (!first) throw new Error('no configuration draft to publish (seed missing)')
    await client.query('SELECT config.publish_version($1, $2, NULL)', [account, first.id])
    report.push('primeira versão de configuração publicada')
  } else {
    report.push('já havia uma versão de configuração em vigor')
  }

  for (const kind of ['terms', 'privacy']) {
    const published = await client.query('SELECT 1 FROM identity.legal_documents WHERE kind = $1 AND published_at IS NOT NULL', [kind])
    if (published.rowCount > 0) continue
    const draft = (await client.query('SELECT id FROM identity.legal_documents WHERE kind = $1 ORDER BY version LIMIT 1', [kind])).rows[0]
    if (draft) {
      await client.query('SELECT identity.publish_legal_document($1, $2)', [account, draft.id])
      report.push(`documento legal "${kind}" publicado (texto em preparação, PC-05)`)
    }
  }
  await client.query('COMMIT')
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined)
  console.error(error)
  fail(`o arranque falhou; nada foi alterado na base.${report.length > 0 ? ` Já feito antes da falha: ${report.join('; ')}.` : ''}`)
} finally {
  await client.end()
}

console.log(`bootstrap-admin (${email}):\n${report.map((line) => `  - ${line}`).join('\n')}`)
