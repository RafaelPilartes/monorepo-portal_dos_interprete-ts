import { afterAll, describe, expect, it } from 'vitest'
import { buildServer } from '../server.js'
import { parseFilePath, safeFileName } from '../lib/files.js'
import { ACCOUNT_A, accountsDatabase, fakeStorage, fakeVerifier } from '../testing/fakes.js'

const SUBJECT = '11111111-1111-4111-8111-111111111111'
const MODERATOR = '00000000-0000-4000-8000-0000000000d1'
const headers = (id = ACCOUNT_A) => ({ authorization: `Bearer token-${id}` })

async function setup(allowed: boolean) {
  const storage = fakeStorage()
  const audits: unknown[][] = []
  const db = accountsDatabase({
    staff: { [MODERATOR]: 'moderator' },
    extra: (sql, params) => {
      if (sql.includes('util.can_access_file')) return { rows: [{ allowed }] }
      if (sql.includes('audit.record')) { audits.push(params); return { rows: [] } }
      return { rows: [] }
    },
  })
  const app = await buildServer({ db, verifyToken: fakeVerifier, storage })
  return { app, storage, db, audits }
}

const upload = { purpose: 'payment_proof', subject_id: SUBJECT, file_name: 'Comprovativo Março.pdf', content_type: 'application/pdf', size_bytes: 1000 }

describe('POST /uploads/sign', async () => {
  const allowed = await setup(true)
  const refused = await setup(false)
  afterAll(async () => { await allowed.app.close(); await refused.app.close() })

  it('signs an upload for the caller, under <purpose>/<subject>/<uuid>-<safe name>', async () => {
    const response = await allowed.app.inject({ method: 'POST', url: '/uploads/sign', headers: headers(), payload: upload })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.path).toMatch(new RegExp(`^payment_proof/${SUBJECT}/[0-9a-f-]{36}-Comprovativo-Marco\\.pdf$`))
    expect(body.signed_upload_url).toContain('payment-proofs/')
    expect(Date.parse(body.expires_at)).toBeGreaterThan(Date.now())
    expect(allowed.db.queries.find((q) => q.sql.includes('can_access_file'))?.params).toEqual([ACCOUNT_A, 'payment_proof', SUBJECT, 'write'])
  })

  it('refuses a wrong type or size with FILE_INVALID before asking SQL', async () => {
    const before = refused.db.queries.length
    const type = await refused.app.inject({ method: 'POST', url: '/uploads/sign', headers: headers(), payload: { ...upload, content_type: 'image/gif' } })
    expect(type.json().error).toMatchObject({ code: 'FILE_INVALID', message: 'Ficheiro inválido: tem de ser PDF, JPG ou PNG.', field: 'file' })
    const size = await refused.app.inject({ method: 'POST', url: '/uploads/sign', headers: headers(), payload: { ...upload, purpose: 'chat_attachment', size_bytes: 6 * 1024 * 1024 } })
    expect(size.json().error.message).toBe('Ficheiro inválido: tem de ter até 5 MB.')
    expect(refused.db.queries.slice(before).some((q) => q.sql.includes('can_access_file'))).toBe(false)
  })

  it('refuses when SQL says the caller may not write for that subject', async () => {
    const response = await refused.app.inject({ method: 'POST', url: '/uploads/sign', headers: headers(), payload: upload })
    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('FORBIDDEN')
    expect(refused.storage.signed).toEqual([])
  })

  it('needs a session and a valid body', async () => {
    expect((await allowed.app.inject({ method: 'POST', url: '/uploads/sign', payload: upload })).statusCode).toBe(401)
    const bad = await allowed.app.inject({ method: 'POST', url: '/uploads/sign', headers: headers(), payload: { ...upload, purpose: 'avatar' } })
    expect(bad.json().error.code).toBe('VALIDATION_FAILED')
  })
})

describe('GET /files/url', async () => {
  const allowed = await setup(true)
  const refused = await setup(false)
  afterAll(async () => { await allowed.app.close(); await refused.app.close() })
  const path = `verification_document/${SUBJECT}/22222222-2222-4222-8222-222222222222-bi.pdf`

  it('signs a five-minute download when SQL allows reading', async () => {
    const response = await allowed.app.inject({ method: 'GET', url: `/files/url?path=${encodeURIComponent(path)}`, headers: headers() })
    expect(response.statusCode).toBe(200)
    expect(allowed.storage.signed.at(-1)).toBe(`download verification-docs/${path} 300`)
    expect(allowed.audits).toHaveLength(0)
  })

  it('audits a staff read of a verification document (R-VER-09)', async () => {
    await allowed.app.inject({ method: 'GET', url: `/files/url?path=${encodeURIComponent(path)}`, headers: headers(MODERATOR) })
    expect(allowed.audits).toHaveLength(1)
    expect(allowed.audits[0]?.slice(0, 5)).toEqual([MODERATOR, 'moderator', 'file.read', 'verification_document', path])
  })

  it('refuses a path the API never issued, or one SQL does not allow, the same way', async () => {
    for (const bad of ['../../etc/passwd', `payment_proof/${SUBJECT}/x.pdf`, `avatars/${SUBJECT}/22222222-2222-4222-8222-222222222222-a.png`]) {
      const response = await allowed.app.inject({ method: 'GET', url: `/files/url?path=${encodeURIComponent(bad)}`, headers: headers() })
      expect(response.json().error.code).toBe('FORBIDDEN')
    }
    const response = await refused.app.inject({ method: 'GET', url: `/files/url?path=${encodeURIComponent(path)}`, headers: headers() })
    expect(response.json().error.code).toBe('FORBIDDEN')
  })
})

describe('file names and paths', () => {
  it('keeps names storage-safe', () => {
    expect(safeFileName('../../Comprovativo Março.pdf')).toBe('Comprovativo-Marco.pdf')
    expect(safeFileName('C:\\fotos\\bi.png')).toBe('bi.png')
    expect(safeFileName('...')).toBeNull()
  })

  it('reads only paths of the issued shape', () => {
    expect(parseFilePath(`chat_attachment/${SUBJECT}/22222222-2222-4222-8222-222222222222-a.pdf`)).toEqual({ purpose: 'chat_attachment', subjectId: SUBJECT })
    expect(parseFilePath(`chat_attachment/${SUBJECT}/../x`)).toBeNull()
  })
})
