import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME } from './index'

describe('data', () => {
  it('is wired into the workspace', () => {
    expect(PACKAGE_NAME).toBe('@portal-dos-interpretes/data')
  })
})
