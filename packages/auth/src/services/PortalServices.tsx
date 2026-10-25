import { createContext, useContext, type ReactNode } from 'react'
import { ApiClient, AuthDAO, createSupabaseClient, DataError, SessionDAO, type IAuthRepository, type ISessionRepository } from '@portal-dos-interpretes/data'
import { createCookieStorage } from '../session/cookieStorage'
import type { Account, Role, SessionSource, StaffLevel } from '../session/SessionContext'

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

interface MeResponse {
  account: { id: string; email: string | null; full_name: string; status: string }
  roles: Role[]
  staff_level: StaffLevel | null
}

export function createPortalServices(options: PortalServicesOptions): PortalServices {
  const storage = createCookieStorage({ domain: options.cookieDomain })
  const client = createSupabaseClient({ url: options.supabaseUrl, anonKey: options.supabaseAnonKey, storage })
  const session = new SessionDAO(client)
  const api = new ApiClient({
    baseUrl: options.apiUrl,
    getAccessToken: async () => (await session.current())?.accessToken ?? null,
  })

  const source: SessionSource = {
    async load(): Promise<Account | null> {
      const current = await session.current()
      if (!current) return null
      try {
        const me = await api.get<MeResponse>('/me')
        return { id: me.account.id, email: me.account.email, fullName: me.account.full_name, roles: me.roles, staffLevel: me.staff_level }
      } catch (error) {
        // A token the API no longer accepts, or a suspended account, is no session here.
        if (error instanceof DataError && (error.code === 'UNAUTHENTICATED' || error.code === 'ACCOUNT_SUSPENDED')) {
          await session.signOut().catch(() => undefined)
          return null
        }
        throw error
      }
    },
    subscribe: (onChange) => session.onChange(() => onChange()),
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
