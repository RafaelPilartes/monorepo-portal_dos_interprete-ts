import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { SessionDAO } from './SessionDAO'

const clientWith = (auth: Record<string, unknown>) => ({ auth }) as unknown as SupabaseClient

describe('SessionDAO', () => {
  it('reports a failed session read as an error, not as "no session"', async () => {
    const dao = new SessionDAO(clientWith({ getSession: async () => ({ data: { session: null }, error: new Error('network') }) }))
    await expect(dao.current()).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })

  it('returns null when there really is no session', async () => {
    const dao = new SessionDAO(clientWith({ getSession: async () => ({ data: { session: null }, error: null }) }))
    await expect(dao.current()).resolves.toBeNull()
  })

  it('throws when sign-out fails, so the screen never claims it signed out', async () => {
    const dao = new SessionDAO(clientWith({ signOut: async () => ({ error: new Error('network') }) }))
    await expect(dao.signOut()).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
  })
})
