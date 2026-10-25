import type { SupabaseClient } from '@supabase/supabase-js'
import { DataError } from '../../domain/errors/DataError'

/** What the apps need to know about the Supabase Auth session; roles come from GET /me (H2). */
export interface AuthSession {
  userId: string
  email: string | null
  accessToken: string
}

/** Port for the shared session (packages/auth depends on it, AD-019). */
export interface ISessionRepository {
  current(): Promise<AuthSession | null>
  onChange(listener: (session: AuthSession | null) => void): () => void
  signOut(): Promise<void>
}

/** Supabase Auth behind the session port; the only place auth calls touch Supabase. */
export class SessionDAO implements ISessionRepository {
  constructor(private readonly client: SupabaseClient) {}

  /** null means "no session"; a failure to read it is an error, not an anonymous visitor. */
  async current(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.getSession()
    if (error) throw new DataError('INTERNAL_ERROR', { cause: error })
    return data.session ? toAuthSession(data.session) : null
  }

  onChange(listener: (session: AuthSession | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(session ? toAuthSession(session) : null)
    })
    return () => data.subscription.unsubscribe()
  }

  /** Throws when the sign-out did not happen, so the screen never claims it did. */
  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) throw new DataError('INTERNAL_ERROR', { cause: error })
  }
}

function toAuthSession(session: { access_token: string; user: { id: string; email?: string | undefined } }): AuthSession {
  return { userId: session.user.id, email: session.user.email ?? null, accessToken: session.access_token }
}
