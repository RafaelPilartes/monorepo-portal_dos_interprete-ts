// Session storage in a cookie of the parent domain, so one login serves the four
// apps on their subdomains (ADR-007, architecture.md §4). Cookies hold ~4 KB, so
// a long session is split into numbered chunks.

const CHUNK_SIZE = 3500
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

export function createCookieStorage(options: CookieStorageOptions = {}): CookieStorage {
  const doc = options.document ?? globalThis.document
  const attributes = [
    'path=/',
    'SameSite=Lax',
    ...(options.domain ? [`domain=${options.domain}`] : []),
    ...(options.secure ? ['Secure'] : []),
  ].join('; ')

  const readAll = (): Map<string, string> => {
    const cookies = new Map<string, string>()
    for (const part of doc.cookie.split(';')) {
      const index = part.indexOf('=')
      if (index === -1) continue
      cookies.set(part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim()))
    }
    return cookies
  }
  const write = (name: string, value: string, maxAge: number) => {
    doc.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; ${attributes}`
  }

  const removeItem = (key: string) => {
    const cookies = readAll()
    const count = Number(cookies.get(`${key}.n`) ?? 0)
    for (let index = 0; index < count; index += 1) write(`${key}.${index}`, '', 0)
    write(`${key}.n`, '', 0)
  }

  return {
    getItem(key) {
      const cookies = readAll()
      const count = Number(cookies.get(`${key}.n`) ?? 0)
      if (!count) return null
      let value = ''
      for (let index = 0; index < count; index += 1) {
        const chunk = cookies.get(`${key}.${index}`)
        if (chunk === undefined) return null // a missing chunk is a broken session, not a partial one
        value += chunk
      }
      return value
    },
    setItem(key, value) {
      removeItem(key)
      const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK_SIZE}}`, 'g')) ?? ['']
      chunks.forEach((chunk, index) => write(`${key}.${index}`, chunk, MAX_AGE_SECONDS))
      write(`${key}.n`, String(chunks.length), MAX_AGE_SECONDS)
    },
    removeItem,
  }
}
