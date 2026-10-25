import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Database } from '../lib/db.js'
import { FILE_INVALID_REASONS, FILE_PURPOSES, FILE_RULES, MB, parseFilePath, safeFileName, type FilePurpose } from '../lib/files.js'
import { ApiError } from '../lib/sendApiError.js'
import { StorageError, type StorageClient } from '../integrations/storage.js'
import { RATE_LIMITS } from '../plugins/rateLimit.js'

// POST /uploads/sign and GET /files/url (api.md §6). Who may write or read is decided by SQL
// (util.can_access_file), the same function for both directions. Staff reads of verification
// documents and chat attachments are audited (R-VER-09, R-PRIV-05).

/** Supabase signs uploads for two hours. */
const UPLOAD_TTL_SECONDS = 2 * 60 * 60
const DOWNLOAD_TTL_SECONDS = 5 * 60
const AUDITED_STAFF_READS: readonly FilePurpose[] = ['verification_document', 'chat_attachment']

const signBody = z.object({
  purpose: z.enum(FILE_PURPOSES),
  subject_id: z.string().uuid(),
  file_name: z.string().min(1).max(255),
  content_type: z.string().min(1).max(100),
  size_bytes: z.number().int().positive(),
})

const urlQuery = z.object({ path: z.string().min(1).max(400) })

async function canAccess(db: Database, accountId: string, purpose: FilePurpose, subjectId: string, mode: 'write' | 'read') {
  return db.transaction(async (client) => {
    const result = await client.query<{ allowed: boolean }>(
      'SELECT util.can_access_file($1, $2, $3, $4) AS allowed',
      [accountId, purpose, subjectId, mode],
    )
    return result.rows[0]?.allowed === true
  })
}

export function registerFileRoutes(server: FastifyInstance, deps: { db: Database; storage: StorageClient }): void {
  server.post('/uploads/sign', { config: { access: 'account', rateLimit: RATE_LIMITS.create } }, async (request) => {
    const body = signBody.parse(request.body)
    const rule = FILE_RULES[body.purpose]
    if (!rule.types.includes(body.content_type)) throw new ApiError('FILE_INVALID', { reason: FILE_INVALID_REASONS.type })
    if (body.size_bytes > rule.maxBytes) {
      throw new ApiError('FILE_INVALID', { reason: FILE_INVALID_REASONS.size(rule.maxBytes / MB) })
    }
    const name = safeFileName(body.file_name)
    if (!name) throw new ApiError('FILE_INVALID', { reason: FILE_INVALID_REASONS.name })
    const account = request.account
    if (!account || !(await canAccess(deps.db, account.id, body.purpose, body.subject_id, 'write'))) {
      throw new ApiError('FORBIDDEN')
    }
    const path = `${body.purpose}/${body.subject_id}/${randomUUID()}-${name}`
    const signed = await deps.storage.signUpload(rule.bucket, path)
    return {
      path,
      signed_upload_url: signed.signedUploadUrl,
      expires_at: new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000).toISOString(),
    }
  })

  server.get('/files/url', { config: { access: 'account' } }, async (request) => {
    const { path } = urlQuery.parse(request.query)
    const parsed = parseFilePath(path)
    const account = request.account
    // A path the API never issued is as forbidden as someone else's: no hint either way.
    if (!parsed || !account || !(await canAccess(deps.db, account.id, parsed.purpose, parsed.subjectId, 'read'))) {
      throw new ApiError('FORBIDDEN')
    }
    let signedUrl: string
    try {
      signedUrl = await deps.storage.signDownload(FILE_RULES[parsed.purpose].bucket, path, DOWNLOAD_TTL_SECONDS)
    } catch (error) {
      // Storage answers 400/404 for a file that was never uploaded or was removed.
      if (error instanceof StorageError && (error.status === 400 || error.status === 404)) throw new ApiError('NOT_FOUND')
      throw error
    }
    if (account.staffLevel && AUDITED_STAFF_READS.includes(parsed.purpose)) {
      await request.audit({ action: 'file.read', entityType: parsed.purpose, entityId: path })
    }
    return { signed_url: signedUrl, expires_at: new Date(Date.now() + DOWNLOAD_TTL_SECONDS * 1000).toISOString() }
  })
}
