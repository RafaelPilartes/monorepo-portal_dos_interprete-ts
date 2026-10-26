import { useEffect, useState } from 'react'
import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { DashboardLayout, type NavGroup, type NavItem } from '@portal-dos-interpretes/ui/components/dashboard-layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { ArrowLeftRight } from 'lucide-react'
import { useSwitchRole } from '../guards/useSwitchRole'
import { useRequiredPortalServices } from '../services/PortalServices'
import { useSession, type Account } from '../session/SessionContext'

// The dashboard of a panel app, filled from the session: name, email, the role switch for an
// account with both roles (R-ACC-04) and, in requester-web, the context of the requests
// ("A pedir como: Particular / {Organização}", accounts-and-organizations.md, Cabeçalho).

const CONTEXT_KEY = 'portal.requestContext'

/**
 * The organisation the person asks in the name of, or null for "Particular" (kept per browser).
 * Without an individual requester profile, "Particular" is not a choice: the first organisation.
 */
export function useRequestContext(account: Account | null): [string | null, (value: string | null) => void] {
  const [value, setValue] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(CONTEXT_KEY)
    } catch {
      return null
    }
  })
  const organizations = account?.organizations.filter((org) => org.status !== 'anonymized') ?? []
  // A context that is no longer valid (left the organisation) falls back.
  const valid = value && organizations.some((org) => org.id === value) ? value : null
  const effective = valid ?? (account && !account.hasRequesterProfile ? organizations[0]?.id ?? null : null)
  useEffect(() => {
    try {
      if (effective) window.localStorage.setItem(CONTEXT_KEY, effective)
      else window.localStorage.removeItem(CONTEXT_KEY)
    } catch {
      // Storage refused (private mode): the choice lasts for this page only.
    }
  }, [effective])
  return [effective, setValue]
}

function RoleSwitch({ account, app }: { account: Account; app: 'requester' | 'interpreter' }) {
  const switchRole = useSwitchRole()
  const other = app === 'requester' ? 'interpreter' : 'requester'
  if (!account.roles.includes(other)) return null
  return (
    <button
      type="button"
      onClick={() => void switchRole(other)}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
      {AUTH_TEXTS.switchTo[other]}
    </button>
  )
}

function RequestContextPicker({ account }: { account: Account }) {
  const [context, setContext] = useRequestContext(account)
  const organizations = account.organizations.filter((org) => org.status !== 'anonymized')
  if (organizations.length === 0) return null
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden text-xs text-muted-foreground md:inline">{AUTH_TEXTS.requestingAs}</span>
      <Select value={context ?? 'individual'} onValueChange={(value) => setContext(value === 'individual' ? null : value)}>
        <SelectTrigger aria-label={AUTH_TEXTS.requestingAs} className="h-8 w-auto min-w-[9rem] max-w-[16rem] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {account.hasRequesterProfile && <SelectItem value="individual">{AUTH_TEXTS.individual}</SelectItem>}
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>{org.name}{org.status === 'suspended' ? ' (suspensa)' : ''}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function PanelLayout({ navigation, app, profileHref, settingsHref }: {
  navigation: (NavItem | NavGroup)[]
  app: 'requester' | 'interpreter' | 'admin'
  profileHref?: string
  settingsHref?: string
}) {
  const session = useSession()
  const services = useRequiredPortalServices()
  const account = session.status === 'authenticated' ? session.account : null
  const headerStart = account && app !== 'admin' && (
    <>
      {app === 'requester' && <RequestContextPicker account={account} />}
      <RoleSwitch account={account} app={app} />
    </>
  )
  return (
    <DashboardLayout
      navigation={navigation}
      userRole={app}
      userName={account?.fullName ?? ''}
      userEmail={account?.email ?? ''}
      {...(profileHref ? { profileHref } : {})}
      {...(settingsHref ? { settingsHref } : {})}
      onSignOut={() => services.session.signOut()}
      headerStart={headerStart}
    />
  )
}
