import type { Database, Queryable } from '../lib/db.js'
import type { StorageClient } from '../integrations/storage.js'
import { InvalidTokenError, type TokenVerifier } from '../lib/tokens.js'

// Test doubles for the unit tests: a database that answers by SQL text, a token verifier that
// accepts "token-<uuid>", and a storage client that records what it signed.

export type QueryHandler = (sql: string, params: unknown[]) => { rows: unknown[] } | Promise<{ rows: unknown[] }>

export function fakeDatabase(handler: QueryHandler): Database & { queries: { sql: string; params: unknown[] }[] } {
  const queries: { sql: string; params: unknown[] }[] = []
  const client = {
    query: async (sql: string, params: unknown[] = []) => {
      queries.push({ sql, params })
      return handler(sql, params)
    },
  } as unknown as Queryable
  return {
    queries,
    transaction: (work) => work(client),
    close: async () => undefined,
  }
}

export const ACCOUNT_A = '00000000-0000-4000-8000-00000000000a'
export const ACCOUNT_B = '00000000-0000-4000-8000-00000000000b'

export const fakeVerifier: TokenVerifier = async (token) => {
  const match = /^token-(.+)$/.exec(token)
  if (!match?.[1]) throw new InvalidTokenError('not a test token')
  return { accountId: match[1] }
}

export function fakeStorage(): StorageClient & { signed: string[] } {
  const signed: string[] = []
  return {
    signed,
    async signUpload(bucket, path) {
      signed.push(`upload ${bucket}/${path}`)
      return { signedUploadUrl: `http://storage.test/upload/${bucket}/${path}?token=t` }
    },
    async signDownload(bucket, path, ttl) {
      signed.push(`download ${bucket}/${path} ${ttl}`)
      return `http://storage.test/download/${bucket}/${path}?token=t`
    },
  }
}

/** A database where every account is active with no staff level unless told otherwise. */
export function accountsDatabase(options: {
  status?: Record<string, string>
  staff?: Record<string, string>
  extra?: QueryHandler
} = {}) {
  return fakeDatabase((sql, params) => {
    if (sql.includes('auth_helper.account_status')) {
      const id = params[0] as string
      return { rows: [{ status: options.status?.[id] ?? 'active', staff_level: options.staff?.[id] ?? null }] }
    }
    if (options.extra) return options.extra(sql, params)
    return { rows: [] }
  })
}
