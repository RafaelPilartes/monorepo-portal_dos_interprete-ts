import { afterAll, describe, expect, it } from 'vitest'
import { buildServer } from '../server.js'
import { ACCOUNT_A, ACCOUNT_B, accountsDatabase, fakeVerifier } from '../testing/fakes.js'
import { InvalidTokenError } from '../lib/tokens.js'
import { requireStaff } from './staff.js'

const SUSPENDED = '00000000-0000-4000-8000-0000000000c1'
const TERMS = '00000000-0000-4000-8000-0000000000c2'
const GONE = '00000000-0000-4000-8000-0000000000c3'
const FINANCE = '00000000-0000-4000-8000-0000000000c4'
const SUPER = '00000000-0000-4000-8000-0000000000c5'

async function server(verifyToken = fakeVerifier) {
  const db = accountsDatabase({
    status: { [SUSPENDED]: 'suspended', [TERMS]: 'terms_required', [GONE]: 'unknown' },
    staff: { [FINANCE]: 'finance', [SUPER]: 'super_admin' },
  })
  const app = await buildServer({ db, verifyToken })
  app.get('/whoami', async (request) => ({ account: request.account }))
  app.get('/me-like', { config: { access: 'session' } }, async (request) => ({ id: request.account?.id }))
  app.get('/open', { config: { access: 'public' } }, async () => ({ ok: true }))
  app.get('/moderation', { preHandler: requireStaff('moderator') }, async () => ({ ok: true }))
  return app
}

const bearer = (id: string) => ({ authorization: `Bearer token-${id}` })

describe('auth plugin', async () => {
  const app = await server()
  afterAll(() => app.close())

  it('refuses a request without a token, with a malformed header or an invalid token: 401 UNAUTHENTICATED', async () => {
    for (const headers of [{}, { authorization: 'Basic abc' }, { authorization: 'Bearer' }, { authorization: 'Bearer forged' }]) {
      const response = await app.inject({ method: 'GET', url: '/whoami', headers })
      expect(response.statusCode).toBe(401)
      expect(response.json().error.code).toBe('UNAUTHENTICATED')
    }
  })

  it('resolves the account from the token, never from the request', async () => {
    const response = await app.inject({ method: 'GET', url: '/whoami?account_id=' + ACCOUNT_B, headers: bearer(ACCOUNT_A) })
    expect(response.statusCode).toBe(200)
    expect(response.json().account).toEqual({ id: ACCOUNT_A, staffLevel: null })
  })

  it('refuses a suspended account, a deleted one, and pending terms outside session routes', async () => {
    expect((await app.inject({ method: 'GET', url: '/whoami', headers: bearer(SUSPENDED) })).json().error.code).toBe('ACCOUNT_SUSPENDED')
    expect((await app.inject({ method: 'GET', url: '/whoami', headers: bearer(GONE) })).json().error.code).toBe('UNAUTHENTICATED')
    const terms = await app.inject({ method: 'GET', url: '/whoami', headers: bearer(TERMS) })
    expect(terms.statusCode).toBe(403)
    expect(terms.json().error.code).toBe('TERMS_ACCEPTANCE_REQUIRED')
    const session = await app.inject({ method: 'GET', url: '/me-like', headers: bearer(TERMS) })
    expect(session.statusCode).toBe(200)
    expect((await app.inject({ method: 'GET', url: '/me-like', headers: bearer(SUSPENDED) })).json().error.code).toBe('ACCOUNT_SUSPENDED')
  })

  it('lets public routes through without a token, and answers an unknown route with 404', async () => {
    expect((await app.inject({ method: 'GET', url: '/open' })).statusCode).toBe(200)
    const missing = await app.inject({ method: 'GET', url: '/nowhere' })
    expect(missing.statusCode).toBe(404)
    expect(missing.json().error.code).toBe('NOT_FOUND')
  })

  it('checks the staff level; super_admin passes every check', async () => {
    expect((await app.inject({ method: 'GET', url: '/moderation', headers: bearer(ACCOUNT_A) })).json().error.code).toBe('FORBIDDEN')
    expect((await app.inject({ method: 'GET', url: '/moderation', headers: bearer(FINANCE) })).json().error.code).toBe('FORBIDDEN')
    expect((await app.inject({ method: 'GET', url: '/moderation', headers: bearer(SUPER) })).statusCode).toBe(200)
  })

  it('treats a verifier failure that is not a bad token as an internal error, not a login problem', async () => {
    const broken = await server(async () => { throw new Error('JWKS unreachable') })
    const response = await broken.inject({ method: 'GET', url: '/whoami', headers: bearer(ACCOUNT_A) })
    expect(response.statusCode).toBe(500)
    expect(response.json().error.code).toBe('INTERNAL_ERROR')
    await broken.close()
    const refusing = await server(async () => { throw new InvalidTokenError('expired') })
    expect((await refusing.inject({ method: 'GET', url: '/whoami', headers: bearer(ACCOUNT_A) })).statusCode).toBe(401)
    await refusing.close()
  })
})
