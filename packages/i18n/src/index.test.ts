import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME } from './index'

describe('i18n', () => {
  it('is wired into the workspace', () => {
    expect(PACKAGE_NAME).toBe('@portal-dos-interpretes/i18n')
  })
})
