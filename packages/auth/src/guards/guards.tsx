import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { useSession, type Role, type StaffLevel } from '../session/SessionContext'

// Guards are experience, not security: the real protection is RLS and the API
// (architecture.md §4). They decide what the screen shows.

function Loading() {
  return (
    <p role="status" className="p-8 text-center text-muted-foreground">
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

/** Without a session, go to /login and come back afterwards (D-05). */
export function RequireSession({ children }: { children: ReactNode }) {
  const session = useSession()
  const location = useLocation()
  if (session.status === 'loading') return <Loading />
  if (session.status === 'error') return <SessionUnavailable />
  if (session.status === 'anonymous') {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  return <>{children}</>
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const session = useSession()
  return (
    <RequireSession>
      {session.status === 'authenticated' && session.account.roles.includes(role) ? children : <Forbidden />}
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
