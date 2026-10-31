// The Supabase Auth server, for what only it can do: create an account and send the confirmation
// email (R-ACC-01). Sign-in, the session and password recovery happen in the browser (packages/auth).

export interface SignUpInput {
  email: string
  password: string
  fullName: string
  intendedRole: 'requester' | 'interpreter' | 'organization'
  /** Where the confirmation link leads: /verify-email of the app of the intended role. */
  redirectTo: string
}

export type SignUpResult =
  | { ok: true; accountId: string }
  | { ok: false; reason: 'weak_password' | 'email_in_use' | 'invalid_email' }

export interface AuthServer {
  signUp(input: SignUpInput): Promise<SignUpResult>
}

/** The Auth server's answer, as far as it matters here. */
interface SignUpResponse {
  id?: string
  user?: { id?: string; identities?: unknown[] }
  identities?: unknown[]
  error_code?: string
  code?: string | number
  msg?: string
}

export function createAuthServer(options: { supabaseUrl: string; serviceRoleKey: string }): AuthServer {
  return {
    async signUp(input) {
      const url = new URL('/auth/v1/signup', options.supabaseUrl)
      url.searchParams.set('redirect_to', input.redirectTo)
      const response = await fetch(url, {
        method: 'POST',
        headers: { apikey: options.serviceRoleKey, 'content-type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          data: { full_name: input.fullName, intended_role: input.intendedRole },
        }),
      })
      const body = (await response.json().catch(() => ({}))) as SignUpResponse
      if (!response.ok) {
        const code = body.error_code ?? ''
        if (code === 'weak_password') return { ok: false, reason: 'weak_password' }
        if (code === 'user_already_exists' || code === 'email_exists') return { ok: false, reason: 'email_in_use' }
        if (code === 'email_address_invalid' || code === 'validation_failed') return { ok: false, reason: 'invalid_email' }
        throw new Error(`auth sign-up failed with ${response.status} ${code}`)
      }
      // With confirmations on, the server answers the user itself; an existing email comes back as
      // a user without identities (the server hides it): the caller already checked the email.
      const user = body.user ?? body
      const identities = user.identities ?? body.identities
      if (!user.id) throw new Error('auth sign-up answered without a user id')
      if (Array.isArray(identities) && identities.length === 0) return { ok: false, reason: 'email_in_use' }
      return { ok: true, accountId: user.id }
    },
  }
}
