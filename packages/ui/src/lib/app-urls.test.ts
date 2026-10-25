import { afterEach, describe, expect, it, vi } from 'vitest'
import { appUrl } from './app-urls'

describe('appUrl', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('uses the development port of each app by default', () => {
    expect(appUrl('requester', '/login')).toBe('http://localhost:5171/login')
    expect(appUrl('site')).toBe('http://localhost:5170/')
  })

  it('uses VITE_<APP>_URL when set, without doubling slashes', () => {
    vi.stubEnv('VITE_REQUESTER_URL', 'https://app.example.ao/')
    expect(appUrl('requester', 'login?returnTo=/interpreters/ana')).toBe(
      'https://app.example.ao/login?returnTo=/interpreters/ana',
    )
  })
})
