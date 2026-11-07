import type { Account } from '../session/SessionContext'

/** The three apps a session can land in (architecture.md §3). */
export type PanelApp = 'requester' | 'interpreter' | 'admin'

export type Destination =
  | { kind: 'here'; path: string }
  | { kind: 'away'; app: 'requester' | 'interpreter' | 'admin'; path: string }

/**
 * R-ACC-04: after the login, the app of last_active_role, or of the only role the account has, or
 * the onboarding when it has none. `app` is where the person is now; terms come first (R-PRIV-02).
 */
export function destinationFor(account: Account, app: PanelApp): Destination {
  if (account.pendingDocuments.length > 0) return { kind: 'here', path: '/accept-terms' }
  if (app === 'admin') return { kind: 'here', path: '/' }
  const panelRoles = account.roles.filter((role): role is 'requester' | 'interpreter' => role !== 'staff')
  const preferred = account.lastActiveRole && panelRoles.includes(account.lastActiveRole)
    ? account.lastActiveRole
    : panelRoles.length === 1 ? panelRoles[0] : panelRoles.includes(app) ? app : undefined
  if (preferred === undefined) {
    if (account.staffLevel) return { kind: 'away', app: 'admin', path: '/' }
    // No role yet: the onboarding of the role chosen at sign-up (R-ACC-01).
    if (account.intendedRole === 'interpreter') return app === 'interpreter' ? { kind: 'here', path: '/onboarding' } : { kind: 'away', app: 'interpreter', path: '/onboarding' }
    const path = account.intendedRole === 'organization' ? '/onboarding/organization' : '/onboarding'
    return app === 'requester' ? { kind: 'here', path } : { kind: 'away', app: 'requester', path }
  }
  return preferred === app ? { kind: 'here', path: '/' } : { kind: 'away', app: preferred, path: '/' }
}
