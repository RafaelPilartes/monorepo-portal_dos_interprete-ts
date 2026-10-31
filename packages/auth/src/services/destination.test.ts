import { describe, expect, it } from 'vitest'
import type { Account } from '../session/SessionContext'
import { destinationFor } from './destination'

const account = (patch: Partial<Account>): Account => ({
  id: 'a', email: 'a@x.ao', fullName: 'Ana', roles: [], staffLevel: null, organizations: [], hasRequesterProfile: false,
  lastActiveRole: null, intendedRole: null, pendingDocuments: [], ...patch,
})

describe('destinationFor (R-ACC-04)', () => {
  it('goes to the app of last_active_role', () => {
    expect(destinationFor(account({ roles: ['requester', 'interpreter'], lastActiveRole: 'interpreter' }), 'requester'))
      .toEqual({ kind: 'away', app: 'interpreter', path: '/' })
  })

  it('without last_active_role, to the app of the only role', () => {
    expect(destinationFor(account({ roles: ['interpreter'] }), 'requester')).toEqual({ kind: 'away', app: 'interpreter', path: '/' })
    expect(destinationFor(account({ roles: ['requester'] }), 'requester')).toEqual({ kind: 'here', path: '/' })
  })

  it('without any role, to the onboarding chosen at sign-up (R-ACC-01)', () => {
    expect(destinationFor(account({ intendedRole: 'interpreter' }), 'requester')).toEqual({ kind: 'away', app: 'interpreter', path: '/onboarding' })
    expect(destinationFor(account({ intendedRole: 'organization' }), 'requester')).toEqual({ kind: 'here', path: '/onboarding/organization' })
    expect(destinationFor(account({}), 'interpreter')).toEqual({ kind: 'away', app: 'requester', path: '/onboarding' })
  })

  it('puts the documents to accept first (R-PRIV-02)', () => {
    expect(destinationFor(account({ roles: ['requester'], pendingDocuments: [{ id: 'd', kind: 'terms', version: 2 }] }), 'requester'))
      .toEqual({ kind: 'here', path: '/accept-terms' })
  })
})
