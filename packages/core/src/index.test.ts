import { describe, expect, it } from 'vitest'
import { APP_NAME } from './index'

describe('core', () => {
  it('exposes the product name', () => {
    expect(APP_NAME).toBe('Portal dos Intérpretes')
  })
})
