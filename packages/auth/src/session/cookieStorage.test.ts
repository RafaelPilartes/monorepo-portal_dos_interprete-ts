import { describe, expect, it } from 'vitest'
import { createCookieStorage } from './cookieStorage'

/** A cookie jar that behaves like document.cookie (set one, read all). */
function fakeDocument() {
  const jar = new Map<string, string>()
  const writes: string[] = []
  return {
    writes,
    get cookie() {
      return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
    },
    set cookie(value: string) {
      writes.push(value)
      const [pair, ...attributes] = value.split(';')
      const [name, ...rest] = (pair ?? '').split('=')
      const expired = attributes.some((attribute) => attribute.trim() === 'max-age=0')
      if (expired) jar.delete((name ?? '').trim())
      else jar.set((name ?? '').trim(), rest.join('='))
    },
  }
}

describe('createCookieStorage (ADR-007)', () => {
  it('round-trips a session longer than one cookie, in chunks', () => {
    const doc = fakeDocument()
    const storage = createCookieStorage({ document: doc })
    const session = 'x'.repeat(8000)
    storage.setItem('sb-session', session)
    expect(storage.getItem('sb-session')).toBe(session)
    expect(doc.cookie).toContain('sb-session.n=3')
  })

  it('writes on the parent domain, Secure and SameSite=Lax in production', () => {
    const doc = fakeDocument()
    createCookieStorage({ document: doc, domain: '.portal.ao', secure: true }).setItem('k', 'v')
    expect(doc.writes[doc.writes.length - 1]).toContain('domain=.portal.ao')
    expect(doc.writes[doc.writes.length - 1]).toContain('Secure')
    expect(doc.writes[doc.writes.length - 1]).toContain('SameSite=Lax')
  })

  it('removes every chunk on sign-out', () => {
    const doc = fakeDocument()
    const storage = createCookieStorage({ document: doc })
    storage.setItem('k', 'y'.repeat(5000))
    storage.removeItem('k')
    expect(storage.getItem('k')).toBeNull()
    expect(doc.cookie).toBe('')
  })

  it('treats a session with a missing chunk as no session', () => {
    const doc = fakeDocument()
    const storage = createCookieStorage({ document: doc })
    storage.setItem('k', 'z'.repeat(5000))
    doc.cookie = 'k.1=; max-age=0'
    expect(storage.getItem('k')).toBeNull()
  })
})
