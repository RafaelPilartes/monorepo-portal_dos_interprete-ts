import { createRemoteJWKSet, decodeProtectedHeader, errors, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose'

// Verifies the Supabase Auth access token locally (no network round-trip per request): against the
// Auth server's JWKS, or with the shared secret when the server signs with HS256.

export interface VerifiedToken {
  accountId: string
}

export type TokenVerifier = (token: string) => Promise<VerifiedToken>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Thrown for any token that must not open a session; the auth plugin answers 401. */
export class InvalidTokenError extends Error {}

/** Errors that mean "this token does not open a session". Anything else (the JWKS cannot be
 * fetched, a timeout) is the server's problem and must not log everyone out. */
function isTokenProblem(error: unknown): boolean {
  if (error instanceof errors.JWKSTimeout || error instanceof errors.JWKSInvalid) return false
  return error instanceof errors.JOSEError
}

export function createTokenVerifier(options: {
  supabaseUrl: string
  jwtSecret?: string | undefined
  /** Tests pass a local key set instead of the Auth server's JWKS. */
  keySet?: JWTVerifyGetKey
}): TokenVerifier {
  const jwks = options.keySet ?? createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', options.supabaseUrl))
  const secret = options.jwtSecret ? new TextEncoder().encode(options.jwtSecret) : undefined

  return async (token) => {
    let payload: JWTPayload
    try {
      let alg: string | undefined
      try {
        alg = decodeProtectedHeader(token).alg
      } catch {
        throw new InvalidTokenError('token header does not decode')
      }
      const verifyOptions = { audience: 'authenticated', clockTolerance: 5, requiredClaims: ['exp', 'sub'] }
      if (alg === 'HS256') {
        if (!secret) throw new InvalidTokenError('HS256 token but no SUPABASE_JWT_SECRET configured')
        payload = (await jwtVerify(token, secret, { ...verifyOptions, algorithms: ['HS256'] })).payload
      } else {
        payload = (await jwtVerify(token, jwks, { ...verifyOptions, algorithms: ['ES256', 'RS256'] })).payload
      }
    } catch (error) {
      if (error instanceof InvalidTokenError || !isTokenProblem(error)) throw error
      throw new InvalidTokenError(String(error))
    }
    if (payload.role !== 'authenticated' || typeof payload.sub !== 'string' || !UUID.test(payload.sub)) {
      throw new InvalidTokenError('token is not an authenticated account')
    }
    return { accountId: payload.sub }
  }
}
