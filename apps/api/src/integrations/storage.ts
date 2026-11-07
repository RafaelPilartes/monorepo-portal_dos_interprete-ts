// The API's door to Supabase Storage (AD-027): signed URLs for private buckets, with the service
// key. Only here does the API call fetch (verify.py, no-direct-data-access).

export interface SignedUpload {
  signedUploadUrl: string
}

export interface StorageClient {
  signUpload(bucket: string, objectPath: string): Promise<SignedUpload>
  signDownload(bucket: string, objectPath: string, expiresInSeconds: number): Promise<string>
}

export class StorageError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
  }
}

function encodePath(objectPath: string): string {
  return objectPath.split('/').map(encodeURIComponent).join('/')
}

export function createStorageClient(options: { supabaseUrl: string; serviceRoleKey: string }): StorageClient {
  const base = new URL('/storage/v1/', options.supabaseUrl)
  const headers = {
    authorization: `Bearer ${options.serviceRoleKey}`,
    apikey: options.serviceRoleKey,
    'content-type': 'application/json',
  }

  async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
    const response = await fetch(new URL(path, base), { method: 'POST', headers, body: JSON.stringify(body) })
    const text = await response.text()
    if (!response.ok) throw new StorageError(`storage ${path} answered ${response.status}: ${text.slice(0, 300)}`, response.status)
    try {
      return JSON.parse(text) as Record<string, unknown>
    } catch {
      throw new StorageError(`storage ${path} answered ${response.status} without JSON`)
    }
  }

  return {
    async signUpload(bucket, objectPath) {
      const body = await post(`object/upload/sign/${bucket}/${encodePath(objectPath)}`, {})
      if (typeof body.url !== 'string') throw new StorageError('storage upload signature without url')
      return { signedUploadUrl: new URL(`/storage/v1${body.url}`, options.supabaseUrl).toString() }
    },
    async signDownload(bucket, objectPath, expiresInSeconds) {
      const body = await post(`object/sign/${bucket}/${encodePath(objectPath)}`, { expiresIn: expiresInSeconds })
      const signed = body.signedURL ?? body.signedUrl
      if (typeof signed !== 'string') throw new StorageError('storage download signature without signedURL')
      return new URL(`/storage/v1${signed}`, options.supabaseUrl).toString()
    },
  }
}
