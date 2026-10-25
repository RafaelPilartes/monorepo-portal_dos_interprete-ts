import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { local } from '../testing/localSupabase.js'
import { createStorageClient } from './storage.js'
import { readSigned, uploadAndRead } from './testing/localAuth.js'

describe('storage client against the local Storage', () => {
  it('signs an upload and a download for a private bucket', async () => {
    const storage = createStorageClient({ supabaseUrl: local.API_URL, serviceRoleKey: local.SERVICE_ROLE_KEY })
    const path = `payment_proof/${randomUUID()}/${randomUUID()}-proof.pdf`
    const upload = await storage.signUpload('payment-proofs', path)
    expect(await uploadAndRead(upload.signedUploadUrl, '%PDF-1.4 test', 'application/pdf')).toBe(200)
    const download = await storage.signDownload('payment-proofs', path, 300)
    expect(await readSigned(download)).toEqual({ status: 200, text: '%PDF-1.4 test' })
  })

  it('cannot read a private file without a signature', async () => {
    const response = await readSigned(`${local.API_URL}/storage/v1/object/public/payment-proofs/anything.pdf`)
    expect(response.status).toBeGreaterThanOrEqual(400)
  })
})
