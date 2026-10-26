import { createContext, useContext, type ReactNode } from 'react'
import { ApiClient, AuthDAO, createSupabaseClient, DataError, SessionDAO, type IAuthRepository, type ISessionRepository } from '@portal-dos-interpretes/data'
import { createCookieStorage } from '../session/cookieStorage'
import type { Account, AccountOrganization, PendingDocument, Role, SessionLoad, SessionSource, StaffLevel } from '../session/SessionContext'

// What every app needs to talk to the platform: the Supabase client (reads by RLS), sign-in and
// session, and the API client (writes). Built once per app from its environment.

export interface PortalServices {
  /** For the DAOs of packages/data; nothing outside packages/data/src/dao/ calls it directly. */
  client: ReturnType<typeof createSupabaseClient>
  auth: IAuthRepository
  session: ISessionRepository
  api: ApiClient
  /** The session as the apps see it: Supabase session + GET /me (R-ACC-02). */
  source: SessionSource
}

export interface PortalServicesOptions {
  supabaseUrl: string
  supabaseAnonKey: string
  apiUrl: string
  /** Parent domain of the four apps in production (ADR-007); omitted on localhost. */
  cookieDomain?: string | undefined
}

/** GET /me (api.md §4). */
export interface MeResponse {
  account: { id: string; email: string | null; full_name: string; status: string }
  roles: Role[]
  staff_level: StaffLevel | null
  organizations?: AccountOrganization[]
  has_requester_profile?: boolean
  last_active_role?: 'requester' | 'interpreter' | null
  intended_role?: 'requester' | 'interpreter' | 'organization' | null
  pending_documents?: PendingDocument[]
}

export function accountFromMe(me: MeResponse): Account {
  return {
    id: me.account.id,
    email: me.account.email,
    fullName: me.account.full_name,
    roles: me.roles,
    staffLevel: me.staff_level,
    organizations: me.organizations ?? [],
    hasRequesterProfile: me.has_requester_profile ?? false,
    lastActiveRole: me.last_active_role ?? null,
    intendedRole: me.intended_role ?? null,
    pendingDocuments: me.pending_documents ?? [],
  }
}

export function createPortalServices(options: PortalServicesOptions): PortalServices {
  const storage = createCookieStorage({ domain: options.cookieDomain })
  const client = createSupabaseClient({ url: options.supabaseUrl, anonKey: options.supabaseAnonKey, storage })
  const session = new SessionDAO(client)
  // Who wants to know that the account changed under the session (suspended, new terms): the
  // session provider, which reads GET /me again and the guards move the person (R-ACC-03, R-PRIV-02).
  const accountChanged = new Set<() => void>()
  const api = new ApiClient({
    baseUrl: options.apiUrl,
    getAccessToken: async () => (await session.current())?.accessToken ?? null,
    onError: (error, { path }) => {
      // GET /me is the session read itself: re-reading on its own failure would loop.
      if (path === '/me') return
      if (error.code === 'ACCOUNT_SUSPENDED' || error.code === 'TERMS_ACCEPTANCE_REQUIRED') accountChanged.forEach((listener) => listener())
    },
  })

  const source: SessionSource = {
    async load(): Promise<SessionLoad> {
      const current = await session.current()
      if (!current) return 'anonymous'
      try {
        return accountFromMe(await api.get<MeResponse>('/me'))
      } catch (error) {
        // R-ACC-03: a suspended account keeps its session only to be told so ("Conta suspensa").
        if (error instanceof DataError && error.code === 'ACCOUNT_SUSPENDED') return 'suspended'
        // A token the API no longer accepts is no session here.
        if (error instanceof DataError && error.code === 'UNAUTHENTICATED') {
          await session.signOut().catch(() => undefined)
          return 'anonymous'
        }
        throw error
      }
    },
    subscribe: (onChange) => {
      const stopSession = session.onChange(() => onChange())
      accountChanged.add(onChange)
      // Reads by RLS come back empty for a suspended account; coming back to the tab re-checks.
      const onVisible = () => {
        if (document.visibilityState === 'visible') onChange()
      }
      document.addEventListener('visibilitychange', onVisible)
      return () => {
        stopSession()
        accountChanged.delete(onChange)
        document.removeEventListener('visibilitychange', onVisible)
      }
    },
  }

  return { client, auth: new AuthDAO(client), session, api, source }
}

const PortalServicesContext = createContext<PortalServices | null>(null)

export function PortalServicesProvider({ services, children }: { services: PortalServices; children: ReactNode }) {
  return <PortalServicesContext.Provider value={services}>{children}</PortalServicesContext.Provider>
}

/** The services, or null in an app that does not have sign-in yet (H2 wires the other three). */
export function usePortalServices(): PortalServices | null {
  return useContext(PortalServicesContext)
}

/** For screens that cannot work without them. */
export function useRequiredPortalServices(): PortalServices {
  const services = useContext(PortalServicesContext)
  if (!services) throw new Error('usePortalServices must be used inside <PortalServicesProvider>')
  return services
}
