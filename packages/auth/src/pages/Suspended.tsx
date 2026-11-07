import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'
import { AuthShell } from '../components/AuthShell'
import { usePortalServices } from '../services/PortalServices'

/** /suspended (R-ACC-03): what a suspended account sees in any app, with the way to the support. */
export default function Suspended() {
  const services = usePortalServices()
  const signOut = async () => {
    await services?.session.signOut().catch((error: unknown) => console.error('[auth] sign-out failed', error))
    window.location.assign(appUrl('site'))
  }
  return (
    <AuthShell title={AUTH_TEXTS.suspendedTitle} subtitle={AUTH_TEXTS.suspendedBody}>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <a href={appUrl('site', '/contact')}>{AUTH_TEXTS.contactSupport}</a>
        </Button>
        <Button variant="outline" onClick={() => void signOut()}>{AUTH_TEXTS.signOut}</Button>
      </div>
    </AuthShell>
  )
}
