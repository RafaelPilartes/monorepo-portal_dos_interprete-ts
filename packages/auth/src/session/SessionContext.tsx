import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/** Platform roles (D-02) and staff levels (D-60); resolved at login from GET /me (H1/H2). */
export type Role = 'requester' | 'interpreter' | 'staff'
export type StaffLevel = 'super_admin' | 'moderator' | 'finance' | 'request_operator'

export interface Account {
  id: string
  email: string | null
  roles: Role[]
  staffLevel: StaffLevel | null
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; account: Account }

/** Where the session comes from; H1/H2 plug the real one (Supabase session + GET /me). */
export interface SessionSource {
  load(): Promise<Account | null>
  subscribe(onChange: () => void): () => void
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ source, children }: { source: SessionSource; children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    const refresh = () => {
      source
        .load()
        .then((account) => {
          if (active) setState(account ? { status: 'authenticated', account } : { status: 'anonymous' })
        })
        // A session that cannot be read is no session: the guards send the person to login.
        .catch(() => {
          if (active) setState({ status: 'anonymous' })
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

export function useSession(): SessionState {
  const state = useContext(SessionContext)
  if (!state) throw new Error('useSession must be used inside <SessionProvider>')
  return state
}
