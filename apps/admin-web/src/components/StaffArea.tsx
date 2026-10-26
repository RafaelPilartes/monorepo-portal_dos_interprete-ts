import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@portal-dos-interpretes/auth'
import { AUTH_TEXTS, COMMON_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'

// The admin app is only for the team (staff-and-config.md, /login). The real protection is RLS and
// the API; this decides what the screen shows.

function NotStaff({ roles }: { roles: string[] }) {
  const home = roles.includes('interpreter') ? appUrl('interpreter') : roles.includes('requester') ? appUrl('requester') : appUrl('site')
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{AUTH_TEXTS.staffOnly}</h1>
      <Button asChild>
        <a href={home}>{AUTH_TEXTS.goToMyArea}</a>
      </Button>
    </main>
  )
}

export function StaffArea() {
  const session = useSession()
  const location = useLocation()
  if (session.status === 'loading') {
    return <p role="status" className="p-8 text-center text-muted-foreground">{COMMON_TEXTS.loading}</p>
  }
  if (session.status === 'error') {
    return <p role="alert" className="p-8 text-center">{COMMON_TEXTS.sessionUnavailable}</p>
  }
  const returnTo = encodeURIComponent(`${location.pathname}${location.search}`)
  if (session.status === 'anonymous') return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  if (session.status === 'suspended') return <Navigate to="/suspended" replace />
  // R-PRIV-02: the team accepts the legal documents in force like everyone else.
  if (session.account.pendingDocuments.length > 0) return <Navigate to={`/accept-terms?returnTo=${returnTo}`} replace />
  if (!session.account.staffLevel) return <NotStaff roles={session.account.roles} />
  return <Outlet />
}
