import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

/** Platform roles (D-02) and staff levels (D-60), resolved from GET /me (R-ACC-02). */
export type Role = 'requester' | 'interpreter' | 'staff'
export type StaffLevel = 'super_admin' | 'moderator' | 'finance' | 'request_operator'
export type OrgRole = 'owner' | 'admin' | 'member'

export interface AccountOrganization {
  id: string
  name: string
  role: OrgRole
  status: 'active' | 'suspended' | 'anonymized'
}

export interface PendingDocument {
  id: string
  kind: 'terms' | 'privacy'
  version: number
}

export interface Account {
  id: string
  email: string | null
  fullName: string
  roles: Role[]
  staffLevel: StaffLevel | null
  organizations: AccountOrganization[]
  /** Asks as an individual too (identity.requester_profiles), not only through organisations. */
  hasRequesterProfile: boolean
  lastActiveRole: 'requester' | 'interpreter' | null
  /** What the person chose at sign-up; only decides where onboarding leads (R-ACC-01). */
  intendedRole: 'requester' | 'interpreter' | 'organization' | null
  /** R-PRIV-02: documents in force not yet accepted; nothing else works until they are. */
  pendingDocuments: PendingDocument[]
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; account: Account }
  /** R-ACC-03: the API refuses the account; the app shows "Conta suspensa". */
  | { status: 'suspended' }
  /** The session could not be read (network, API); never shown as "not logged in". */
  | { status: 'error' }

export type SessionLoad = Account | 'anonymous' | 'suspended'

/** Where the session comes from: the Supabase session + GET /me (packages/auth services). */
export interface SessionSource {
  load(): Promise<SessionLoad>
  subscribe(onChange: () => void): () => void
}

const SessionContext = createContext<SessionState | null>(null)
const RefreshContext = createContext<() => Promise<void>>(async () => undefined)

export function SessionProvider({ source, children }: { source: SessionSource; children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  // Only the latest read may set the state: an older, slower read must not
  // bring back a session that a sign-out already ended.
  const latestRead = useRef(0)
  const active = useRef(true)

  const refresh = useCallback(async () => {
    const read = ++latestRead.current
    const isCurrent = () => active.current && read === latestRead.current
    try {
      const loaded = await source.load()
      if (!isCurrent()) return
      if (loaded === 'anonymous') setState({ status: 'anonymous' })
      else if (loaded === 'suspended') setState({ status: 'suspended' })
      else setState({ status: 'authenticated', account: loaded })
    } catch (error) {
      console.error('[auth] session could not be read', error)
      // A failed refresh (e.g. the network, while renewing the token) keeps the session the
      // screen already has; only a first read that fails is shown as an error.
      if (isCurrent()) setState((current) => (current.status === 'authenticated' ? current : { status: 'error' }))
    }
  }, [source])

  useEffect(() => {
    active.current = true
    void refresh()
    const unsubscribe = source.subscribe(() => void refresh())
    return () => {
      active.current = false
      unsubscribe()
    }
  }, [source, refresh])

  return (
    <RefreshContext.Provider value={refresh}>
      <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
    </RefreshContext.Provider>
  )
}

/** The session, or null in an app without a SessionProvider (the public site). */
export function useOptionalSession(): SessionState | null {
  return useContext(SessionContext)
}

export function useSession(): SessionState {
  const state = useContext(SessionContext)
  if (!state) throw new Error('useSession must be used inside <SessionProvider>')
  return state
}

/** Reads GET /me again (after accepting terms, onboarding, joining an organisation). */
export function useRefreshSession(): () => Promise<void> {
  return useContext(RefreshContext)
}
