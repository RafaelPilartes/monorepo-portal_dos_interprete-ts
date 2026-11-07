import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SessionProvider, type Account, type SessionSource } from '../session/SessionContext'
import { RequireRole, RequireSession, RequireStaffLevel } from './guards'

const source = (account: Account | null | 'suspended'): SessionSource => ({ load: async () => account ?? 'anonymous', subscribe: () => () => {} })
const pending: SessionSource = { load: () => new Promise(() => {}), subscribe: () => () => {} }

function LoginProbe() {
  const location = useLocation()
  return <p>login {location.search}</p>
}

function Probe({ name }: { name: string }) {
  const location = useLocation()
  return <p>{name} {location.search}</p>
}

function renderGuarded(src: SessionSource, guarded: React.ReactNode, path = '/requests/7?tab=chat') {
  return render(
    <SessionProvider source={src}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/suspended" element={<Probe name="suspended" />} />
          <Route path="/accept-terms" element={<Probe name="terms" />} />
          <Route path="/onboarding" element={<Probe name="onboarding" />} />
          <Route path="*" element={guarded} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  )
}

const base = { organizations: [], hasRequesterProfile: false, lastActiveRole: null, intendedRole: null, pendingDocuments: [] }
const requester: Account = { ...base, id: 'a1', email: 'a@x.ao', fullName: 'Ana', roles: ['requester'], staffLevel: null, hasRequesterProfile: true }
const finance: Account = { ...base, id: 's1', email: 's@x.ao', fullName: 'Sara', roles: ['staff'], staffLevel: 'finance' }
const superAdmin: Account = { ...base, id: 's2', email: 'r@x.ao', fullName: 'Rui', roles: ['staff'], staffLevel: 'super_admin' }

describe('RequireSession', () => {
  it('shows a loading state while the session is read', () => {
    renderGuarded(pending, <RequireSession>secret</RequireSession>)
    expect(screen.getByRole('status').textContent).toBe('A carregar…')
  })

  it('sends a visitor to /login with returnTo, and back afterwards is H2/H4 (D-05)', async () => {
    renderGuarded(source(null), <RequireSession>secret</RequireSession>)
    expect((await screen.findByText(/^login/)).textContent).toBe(`login ?returnTo=${encodeURIComponent('/requests/7?tab=chat')}`)
  })

  it('shows the screen with a session', async () => {
    renderGuarded(source(requester), <RequireSession>secret</RequireSession>)
    expect(await screen.findByText('secret')).toBeTruthy()
  })
})

describe('session read failures and races (review of step E)', () => {
  it('says the session could not be read instead of sending the person to login', async () => {
    const failing: SessionSource = { load: async () => Promise.reject(new Error('network')), subscribe: () => () => {} }
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderGuarded(failing, <RequireSession>secret</RequireSession>)
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Não foi possível verificar a tua sessão. Verifica a ligação e tenta outra vez.',
    )
    log.mockRestore()
  })

  it('does not let an older, slower read bring back a session after sign-out', async () => {
    let notify = () => {}
    let resolveFirst: (account: Account) => void = () => {}
    let call = 0
    const racing: SessionSource = {
      load: () => {
        call += 1
        return call === 1 ? new Promise((resolve) => (resolveFirst = resolve)) : Promise.resolve('anonymous' as const)
      },
      subscribe: (onChange) => {
        notify = onChange
        return () => {}
      },
    }
    renderGuarded(racing, <RequireSession>secret</RequireSession>)
    await act(async () => notify()) // sign-out event: second read resolves to "no session"
    await act(async () => resolveFirst(requester)) // the first, older read finishes late
    expect(screen.queryByText('secret')).toBeNull()
    expect((await screen.findByText(/^login/)).textContent).toContain('returnTo')
  })
})

describe('account states (R-ACC-03, R-PRIV-02)', () => {
  it('sends a suspended account to /suspended', async () => {
    renderGuarded(source('suspended'), <RequireSession>secret</RequireSession>)
    expect(await screen.findByText(/^suspended/)).toBeTruthy()
  })

  it('sends an account with documents to accept to /accept-terms, coming back afterwards', async () => {
    renderGuarded(source({ ...requester, pendingDocuments: [{ id: 'd1', kind: 'terms', version: 2 }] }), <RequireSession>secret</RequireSession>)
    expect((await screen.findByText(/^terms/)).textContent).toBe(`terms ?returnTo=${encodeURIComponent('/requests/7?tab=chat')}`)
    expect(screen.queryByText('secret')).toBeNull()
  })
})

describe('RequireRole (R-ACC-02, R-ACC-04)', () => {
  it('shows the area to an account with the role', async () => {
    renderGuarded(source(requester), <RequireRole role="requester">secret</RequireRole>)
    expect(await screen.findByText('secret')).toBeTruthy()
  })

  it('offers the switch to an account that has the other role', async () => {
    renderGuarded(source(requester), <RequireRole role="interpreter">secret</RequireRole>)
    expect((await screen.findByRole('heading')).textContent).toBe('Esta área é para intérpretes')
    expect(screen.getByRole('button', { name: 'Mudar para solicitante' })).toBeTruthy()
    expect(screen.queryByText('secret')).toBeNull()
  })

  it('sends an account without any role to the onboarding', async () => {
    renderGuarded(source({ ...requester, roles: [] }), <RequireRole role="requester">secret</RequireRole>)
    expect(await screen.findByText(/^onboarding/)).toBeTruthy()
  })
})

describe('RequireStaffLevel (D-60)', () => {
  it('lets the listed level in and keeps the others out', async () => {
    renderGuarded(source(finance), <RequireStaffLevel levels={['finance']}>payouts</RequireStaffLevel>)
    expect(await screen.findByText('payouts')).toBeTruthy()
  })

  it('refuses a level that is not listed', async () => {
    renderGuarded(source(finance), <RequireStaffLevel levels={['moderator']}>reports</RequireStaffLevel>)
    expect(await screen.findByRole('alert')).toBeTruthy()
  })

  it('refuses a staff level on an account that is not staff', async () => {
    renderGuarded(source({ ...superAdmin, roles: ['requester'] }), <RequireStaffLevel levels={['moderator']}>reports</RequireStaffLevel>)
    expect(await screen.findByRole('alert')).toBeTruthy()
  })

  it('always lets super_admin in', async () => {
    renderGuarded(source(superAdmin), <RequireStaffLevel levels={['moderator']}>reports</RequireStaffLevel>)
    expect(await screen.findByText('reports')).toBeTruthy()
  })
})
