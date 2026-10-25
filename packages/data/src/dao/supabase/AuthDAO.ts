import type { SupabaseClient } from '@supabase/supabase-js'
import { DataError } from '../../domain/errors/DataError'

/** Why a sign-in did not open a session; the login screen says it in Portuguese. */
export type SignInRefusal = 'invalid_credentials' | 'email_not_confirmed'

export type SignInResult = { ok: true } | { ok: false; reason: SignInRefusal }

/** Port for signing in with email and password (accounts-and-organizations.md, /login). */
export interface IAuthRepository {
  signIn(email: string, password: string): Promise<SignInResult>
}

/** Supabase Auth behind the sign-in port. A refusal is a result; anything else throws. */
export class AuthDAO implements IAuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async signIn(email: string, password: string): Promise<SignInResult> {
    const { error } = await this.client.auth.signInWithPassword({ email: email.trim(), password })
    if (!error) return { ok: true }
    const code = 'code' in error ? (error as { code?: string }).code : undefined
    if (code === 'invalid_credentials' || error.status === 400 && /invalid login credentials/i.test(error.message)) {
      return { ok: false, reason: 'invalid_credentials' }
    }
    if (code === 'email_not_confirmed') return { ok: false, reason: 'email_not_confirmed' }
    throw new DataError('INTERNAL_ERROR', { cause: error })
  }
}
