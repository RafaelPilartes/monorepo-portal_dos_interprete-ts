import { describe, expect, it } from 'vitest'
import { safeReturnTo } from './returnTo'

describe('safeReturnTo', () => {
  it('follows a path inside the app', () => {
    expect(safeReturnTo('/interpreters/maria-santos')).toBe('/interpreters/maria-santos')
    expect(safeReturnTo('/audit?page=2')).toBe('/audit?page=2')
  })

  it('ignores anything that could leave the app (accounts criterion 2)', () => {
    for (const value of ['https://outro-site.com', '//outro-site.com', '/\\outro-site.com', 'javascript:alert(1)', 'audit', '/\nx', '', null, undefined]) {
      expect(safeReturnTo(value)).toBe('/')
    }
  })
})
