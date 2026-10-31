import type { SupabaseClient } from '@supabase/supabase-js'
import { DataError } from '../../domain/errors/DataError'

/** Why a sign-in did not open a session; the login screen says it in Portuguese. */
export type SignInRefusal = 'invalid_credentials' | 'email_not_confirmed'

export type SignInResult = { ok: true } | { ok: false; reason: SignInRefusal }

/** Port for the browser side of the Auth server (accounts-and-organizations.md, entry pages). */
export interface IAuthRepository {
  signIn(email: string, password: string): Promise<SignInResult>
  /** Always resolves the same way whether or not the account exists (the screen says the same). */
  requestPasswordReset(email: string, redirectTo: string): Promise<void>
  /** For the session opened by a recovery link; false when the server finds the password weak. */
  updatePassword(password: string): Promise<{ ok: true } | { ok: false; reason: 'weak_password' }>
  resendConfirmation(email: string, redirectTo: string): Promise<void>
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

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    // Too many requests is said; any other refusal looks like success (no account enumeration).
    if (error && error.status === 429) throw new DataError('RATE_LIMITED', { cause: error })
    if (error && (error.status ?? 500) >= 500) throw new DataError('INTERNAL_ERROR', { cause: error })
  }

  async updatePassword(password: string): Promise<{ ok: true } | { ok: false; reason: 'weak_password' }> {
    const { error } = await this.client.auth.updateUser({ password })
    if (!error) return { ok: true }
    const code = 'code' in error ? (error as { code?: string }).code : undefined
    if (code === 'weak_password' || code === 'same_password') return { ok: false, reason: 'weak_password' }
    if (error.status === 401 || code === 'session_not_found') throw new DataError('UNAUTHENTICATED', { cause: error })
    throw new DataError('INTERNAL_ERROR', { cause: error })
  }

  async resendConfirmation(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.client.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectTo } })
    if (error && error.status === 429) throw new DataError('RATE_LIMITED', { cause: error })
    if (error && (error.status ?? 500) >= 500) throw new DataError('INTERNAL_ERROR', { cause: error })
  }
}
