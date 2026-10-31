// Session storage in a cookie of the parent domain, so one login serves the four
// apps on their subdomains (ADR-007, architecture.md §4). A browser drops a
// cookie larger than ~4 KB without a word, so the value is URI-encoded FIRST and
// the encoded text is split into numbered chunks that each stay under the limit.

/** Encoded characters per chunk; with the name and attributes a cookie stays well under 4096 bytes. */
const CHUNK_SIZE = 3000
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export interface CookieStorageOptions {
  /** Parent domain, e.g. ".portaldosinterpretes.ao"; omit on localhost (cookies are shared across ports). */
  domain?: string | undefined
  /** Secure cookies need HTTPS; true in production (ADR-007). */
  secure?: boolean | undefined
  document?: Pick<Document, 'cookie'> | undefined
}

export interface CookieStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Splits encoded text without cutting a %XX escape in half. */
function splitEncoded(encoded: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < encoded.length) {
    let end = Math.min(start + CHUNK_SIZE, encoded.length)
    const escapeAt = encoded.lastIndexOf('%', end - 1)
    if (escapeAt >= end - 2 && escapeAt >= start && end < encoded.length) end = escapeAt
    chunks.push(encoded.slice(start, end))
    start = end
  }
  return chunks.length ? chunks : ['']
}

export function createCookieStorage(options: CookieStorageOptions = {}): CookieStorage {
  const doc = options.document ?? globalThis.document
  const attributes = [
    'path=/',
    'SameSite=Lax',
    ...(options.domain ? [`domain=${options.domain}`] : []),
    ...(options.secure ? ['Secure'] : []),
  ].join('; ')

  /** Raw (still encoded) values of our own cookies only; other cookies are never decoded. */
  const readOwn = (key: string): Map<string, string> => {
    const own = new Map<string, string>()
    for (const part of doc.cookie.split(';')) {
      const index = part.indexOf('=')
      if (index === -1) continue
      const name = part.slice(0, index).trim()
      if (name.startsWith(`${key}.`)) own.set(name, part.slice(index + 1).trim())
    }
    return own
  }
  const write = (name: string, rawValue: string, maxAge: number) => {
    doc.cookie = `${name}=${rawValue}; max-age=${maxAge}; ${attributes}`
  }

  const removeItem = (key: string) => {
    const count = Number(readOwn(key).get(`${key}.n`) ?? 0)
    for (let index = 0; index < count; index += 1) write(`${key}.${index}`, '', 0)
    write(`${key}.n`, '', 0)
  }

  return {
    getItem(key) {
      const own = readOwn(key)
      const count = Number(own.get(`${key}.n`) ?? 0)
      if (!count) return null
      let encoded = ''
      for (let index = 0; index < count; index += 1) {
        const chunk = own.get(`${key}.${index}`)
        if (chunk === undefined) return null // a missing chunk is a broken session, not a partial one
        encoded += chunk
      }
      try {
        return decodeURIComponent(encoded)
      } catch {
        return null
      }
    },
    setItem(key, value) {
      removeItem(key)
      const chunks = splitEncoded(encodeURIComponent(value))
      chunks.forEach((chunk, index) => write(`${key}.${index}`, chunk, MAX_AGE_SECONDS))
      write(`${key}.n`, String(chunks.length), MAX_AGE_SECONDS)
    },
    removeItem,
  }
}
