import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, UnsecuredJWT, type JWK } from 'jose'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTokenVerifier, InvalidTokenError } from './tokens.js'

// The real verifier against a local ES256 key set (the local Auth server signs with ES256).
const SUB = '00000000-0000-4000-8000-00000000000a'
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey']
let jwk: JWK

beforeAll(async () => {
  const pair = await generateKeyPair('ES256')
  privateKey = pair.privateKey
  jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'ES256' }
})

const verifier = () => createTokenVerifier({ supabaseUrl: 'http://auth.test', keySet: createLocalJWKSet({ keys: [jwk] }) })

async function sign(claims: Record<string, unknown>, expiresIn: string | number = '1h') {
  return new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: 'k1' }).setIssuedAt().setExpirationTime(expiresIn).sign(privateKey)
}

describe('createTokenVerifier', () => {
  it('accepts a valid session token and returns its account', async () => {
    const token = await sign({ sub: SUB, role: 'authenticated', aud: 'authenticated' })
    expect(await verifier()(token)).toEqual({ accountId: SUB })
  })

  it('refuses an expired token, a wrong audience, an anon token and an unsigned one', async () => {
    const expired = await sign({ sub: SUB, role: 'authenticated', aud: 'authenticated' }, Math.floor(Date.now() / 1000) - 60)
    const audience = await sign({ sub: SUB, role: 'authenticated', aud: 'other' })
    const anon = await sign({ role: 'anon', aud: 'authenticated', sub: SUB.replace('a', 'b').slice(0, 30) })
    const unsigned = new UnsecuredJWT({ sub: SUB, role: 'authenticated', aud: 'authenticated' }).setExpirationTime('1h').encode()
    for (const token of [expired, audience, anon, unsigned, 'not.a.token']) {
      await expect(verifier()(token)).rejects.toBeInstanceOf(InvalidTokenError)
    }
  })

  it('treats an unreachable key server as a server error, not as a logged-out session', async () => {
    const remote = createTokenVerifier({ supabaseUrl: 'http://127.0.0.1:9' })
    const token = await sign({ sub: SUB, role: 'authenticated', aud: 'authenticated' })
    const error = await remote(token).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(InvalidTokenError)
  })
})
