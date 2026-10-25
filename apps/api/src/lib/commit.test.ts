import { describe, expect, it } from 'vitest'
import { resolveCommit } from './commit.js'

describe('resolveCommit', () => {
  it('prefers GIT_COMMIT', () => {
    expect(resolveCommit({ GIT_COMMIT: 'abc1234' })).toBe('abc1234')
  })

  it('falls back to the git commit of the working tree', () => {
    expect(resolveCommit({})).toMatch(/^[0-9a-f]{7,}$/)
  })
})
