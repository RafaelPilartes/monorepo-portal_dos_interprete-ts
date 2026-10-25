import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

/** Platform roles (D-02) and staff levels (D-60); resolved at login from GET /me (H1/H2). */
export type Role = 'requester' | 'interpreter' | 'staff'
export type StaffLevel = 'super_admin' | 'moderator' | 'finance' | 'request_operator'

export interface Account {
  id: string
  email: string | null
  fullName: string
  roles: Role[]
  staffLevel: StaffLevel | null
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; account: Account }
  /** The session could not be read (network, API); never shown as "not logged in". */
  | { status: 'error' }

/** Where the session comes from; H1/H2 plug the real one (Supabase session + GET /me). */
export interface SessionSource {
  load(): Promise<Account | null>
  subscribe(onChange: () => void): () => void
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ source, children }: { source: SessionSource; children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  // Only the latest read may set the state: an older, slower read must not
  // bring back a session that a sign-out already ended.
  const latestRead = useRef(0)

  useEffect(() => {
    let active = true
    const refresh = () => {
      const read = ++latestRead.current
      const isCurrent = () => active && read === latestRead.current
      source
        .load()
        .then((account) => {
          if (isCurrent()) setState(account ? { status: 'authenticated', account } : { status: 'anonymous' })
        })
        .catch((error: unknown) => {
          console.error('[auth] session could not be read', error)
          // A failed refresh (e.g. the network, while renewing the token) keeps the session the
          // screen already has; only a first read that fails is shown as an error.
          if (isCurrent()) setState((current) => (current.status === 'authenticated' ? current : { status: 'error' }))
        })
    }
    refresh()
    const unsubscribe = source.subscribe(refresh)
    return () => {
      active = false
      unsubscribe()
    }
  }, [source])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

/** The session, or null in an app without a SessionProvider (sign-in arrives in H2 there). */
export function useOptionalSession(): SessionState | null {
  return useContext(SessionContext)
}

export function useSession(): SessionState {
  const state = useContext(SessionContext)
  if (!state) throw new Error('useSession must be used inside <SessionProvider>')
  return state
}
