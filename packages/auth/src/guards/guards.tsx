import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { AUTH_TEXTS, COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'
import { destinationFor } from '../services/destination'
import { useSession, type Account, type Role, type StaffLevel } from '../session/SessionContext'
import { useSwitchRole } from './useSwitchRole'

// Guards are experience, not security: the real protection is RLS and the API
// (architecture.md §4). They decide what the screen shows.

function Loading() {
  return (
    <p role="status" className="p-8 text-center text-sm text-muted-foreground">
      {COMMON_TEXTS.loading}
    </p>
  )
}

function SessionUnavailable() {
  return (
    <p role="alert" className="p-8 text-center">
      {COMMON_TEXTS.sessionUnavailable}
    </p>
  )
}

function Forbidden() {
  return (
    <p role="alert" className="p-8 text-center">
      {errorFor('FORBIDDEN').message}
    </p>
  )
}

/**
 * Without a session, go to /login and come back afterwards (D-05). A suspended account goes to
 * /suspended (R-ACC-03); one with legal documents to accept, to /accept-terms (R-PRIV-02).
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const session = useSession()
  const location = useLocation()
  const here = `${location.pathname}${location.search}`
  if (session.status === 'loading') return <Loading />
  if (session.status === 'error') return <SessionUnavailable />
  if (session.status === 'suspended') return <Navigate to="/suspended" replace />
  if (session.status === 'anonymous') {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(here)}`} replace />
  }
  if (session.account.pendingDocuments.length > 0) {
    return <Navigate to={`/accept-terms?returnTo=${encodeURIComponent(here)}`} replace />
  }
  return <>{children}</>
}

/** Leaves for another app (a full navigation: the other app has its own bundle). */
export function GoToApp({ url }: { url: string }) {
  useEffect(() => window.location.assign(url), [url])
  return <Loading />
}

/** What a person sees in an app whose role the account does not have (R-ACC-02, R-ACC-04). */
function MissingRole({ account, role }: { account: Account; role: 'requester' | 'interpreter' }) {
  const switchRole = useSwitchRole()
  const other = role === 'requester' ? 'interpreter' : 'requester'
  const destination = destinationFor(account, role)
  // Without any role of a panel, the onboarding of this app (or of the one chosen at sign-up).
  if (!account.roles.includes(other)) {
    if (destination.kind === 'here') return <Navigate to={destination.path} replace />
    if (destination.app === 'admin') return <Navigate to="/onboarding" replace />
    return <GoToApp url={appUrl(destination.app, destination.path)} />
  }
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">{AUTH_TEXTS.wrongArea[role]}</h1>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => void switchRole(other)}>{AUTH_TEXTS.switchTo[other]}</Button>
        <Button variant="outline" asChild>
          <a href="/onboarding">{AUTH_TEXTS.createRole[role]}</a>
        </Button>
      </div>
    </main>
  )
}

/** A panel app's area: a session with the role of that app (requester-web, interpreter-web). */
export function RequireRole({ role, children }: { role: Exclude<Role, 'staff'>; children: ReactNode }) {
  const session = useSession()
  return (
    <RequireSession>
      {session.status === 'authenticated' && session.account.roles.includes(role)
        ? children
        : session.status === 'authenticated' ? <MissingRole account={session.account} role={role} /> : null}
    </RequireSession>
  )
}

/** Staff areas by level (D-60); super_admin passes everywhere (api.md §1). */
export function RequireStaffLevel({ levels, children }: { levels: StaffLevel[]; children: ReactNode }) {
  const session = useSession()
  const isStaff = session.status === 'authenticated' && session.account.roles.includes('staff')
  const level = isStaff && session.status === 'authenticated' ? session.account.staffLevel : null
  const allowed = level !== null && (level === 'super_admin' || levels.includes(level))
  return <RequireSession>{allowed ? children : <Forbidden />}</RequireSession>
}
