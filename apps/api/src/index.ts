import { EnvError, loadEnv } from './config/env.js'
import { createAuthServer } from './integrations/auth.js'
import { createSmtpAdapter } from './integrations/email/adapter.js'
import { createStorageClient } from './integrations/storage.js'
import { startEmailWorker } from './jobs/emailOutbox.js'
import { resolveCommit } from './lib/commit.js'
import { createDatabase } from './lib/db.js'
import { resolveMigrationInBuild } from './lib/migrations.js'
import { createTokenVerifier } from './lib/tokens.js'
import { buildServer } from './server.js'

let env
try {
  env = loadEnv()
} catch (error) {
  if (error instanceof EnvError) {
    console.error(error.message)
    process.exit(1)
  }
  throw error
}

const db = createDatabase(env.DATABASE_URL)
const appUrls = { site: env.SITE_URL, requester: env.REQUESTER_URL, interpreter: env.INTERPRETER_URL, admin: env.ADMIN_URL }
const server = await buildServer({
  commit: resolveCommit(),
  logger: { level: env.LOG_LEVEL },
  migrationInBuild: resolveMigrationInBuild(env.MIGRATION_IN_BUILD),
  trustProxyHops: env.TRUST_PROXY_HOPS ?? 0,
  appOrigins: env.APP_ORIGINS,
  db,
  verifyToken: createTokenVerifier({ supabaseUrl: env.SUPABASE_URL, jwtSecret: env.SUPABASE_JWT_SECRET }),
  storage: createStorageClient({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY }),
  authServer: createAuthServer({ supabaseUrl: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY }),
  appUrls,
})

const stopWorker = env.EMAIL_WORKER_ENABLED
  ? startEmailWorker({
      db,
      log: server.log,
      appUrls,
      adapter: createSmtpAdapter({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
        from: env.EMAIL_FROM,
      }),
    })
  : async () => undefined

async function shutdown(signal: string): Promise<void> {
  server.log.info({ signal }, 'shutting down')
  await stopWorker()
  await server.close()
  await db.close()
  process.exit(0)
}
process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))

// Railway and Docker need 0.0.0.0 (architecture.md §6).
server.listen({ host: env.HOST, port: env.PORT }).catch((error: unknown) => {
  server.log.error(error)
  process.exit(1)
})
