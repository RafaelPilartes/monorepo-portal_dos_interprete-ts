import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose'

// Verifies the Supabase Auth access token locally (no network round-trip per request): against the
// Auth server's JWKS, or with the shared secret when the server signs with HS256.

export interface VerifiedToken {
  accountId: string
}

export type TokenVerifier = (token: string) => Promise<VerifiedToken>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Thrown for any token that must not open a session; the auth plugin answers 401. */
export class InvalidTokenError extends Error {}

export function createTokenVerifier(options: { supabaseUrl: string; jwtSecret?: string | undefined }): TokenVerifier {
  const jwks = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', options.supabaseUrl))
  const secret = options.jwtSecret ? new TextEncoder().encode(options.jwtSecret) : undefined

  return async (token) => {
    let payload: JWTPayload
    try {
      const { alg } = decodeProtectedHeader(token)
      const verifyOptions = { audience: 'authenticated', clockTolerance: 5 }
      if (alg === 'HS256') {
        if (!secret) throw new InvalidTokenError('HS256 token but no SUPABASE_JWT_SECRET configured')
        payload = (await jwtVerify(token, secret, { ...verifyOptions, algorithms: ['HS256'] })).payload
      } else {
        payload = (await jwtVerify(token, jwks, { ...verifyOptions, algorithms: ['ES256', 'RS256'] })).payload
      }
    } catch (error) {
      throw error instanceof InvalidTokenError ? error : new InvalidTokenError(String(error))
    }
    if (payload.role !== 'authenticated' || typeof payload.sub !== 'string' || !UUID.test(payload.sub)) {
      throw new InvalidTokenError('token is not an authenticated account')
    }
    return { accountId: payload.sub }
  }
}
