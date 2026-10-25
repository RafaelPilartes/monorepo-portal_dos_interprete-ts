import { z } from 'zod'

// Every variable the API reads, validated once at start (foundation.md §G item 1). Names only in
// .env.example; values never in the repository.
const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true')
const urlList = z
  .string()
  .min(1)
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(z.string().url()).min(1))

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  /** Only when the Auth server signs with HS256 (the local stack may); otherwise JWKS is used. */
  SUPABASE_JWT_SECRET: z.string().min(32).optional(),
  /** Browser origins allowed by CORS: the four web apps (architecture.md §8). */
  APP_ORIGINS: urlList,
  /** Proxies in front of the API; a fixed hop count, never "trust everything" (foundation.md §G). */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_SECURE: booleanFlag.default('false'),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3),
  EMAIL_WORKER_ENABLED: booleanFlag.default('true'),
  /** Overrides the last migration the build carries (tsup writes it into the bundle). */
  MIGRATION_IN_BUILD: z.string().regex(/^\d{4}-[a-z0-9-]+\.sql$/).optional(),
})

export type Env = z.infer<typeof schema>

/** Thrown when the configuration is unusable; the message lists every problem, in Portuguese. */
export class EnvError extends Error {}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source)
  if (result.success) return result.data
  const lines = result.error.issues.map((issue) => {
    const name = issue.path.join('.')
    return source[name] === undefined || source[name] === ''
      ? `  - ${name}: falta`
      : `  - ${name}: valor inválido (${issue.message})`
  })
  throw new EnvError(`A API não arranca: a configuração tem problemas.\n${lines.join('\n')}\nVê .env.example.`)
}
