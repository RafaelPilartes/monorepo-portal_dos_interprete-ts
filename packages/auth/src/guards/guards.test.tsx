import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SessionProvider, type Account, type SessionSource } from '../session/SessionContext'
import { RequireRole, RequireSession, RequireStaffLevel } from './guards'

const source = (account: Account | null): SessionSource => ({ load: async () => account, subscribe: () => () => {} })
const pending: SessionSource = { load: () => new Promise(() => {}), subscribe: () => () => {} }

function LoginProbe() {
  const location = useLocation()
  return <p>login {location.search}</p>
}

function renderGuarded(src: SessionSource, guarded: React.ReactNode, path = '/requests/7?tab=chat') {
  return render(
    <SessionProvider source={src}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="*" element={guarded} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  )
}

const requester: Account = { id: 'a1', email: 'a@x.ao', roles: ['requester'], staffLevel: null }
const finance: Account = { id: 's1', email: 's@x.ao', roles: ['staff'], staffLevel: 'finance' }
const superAdmin: Account = { id: 's2', email: 'r@x.ao', roles: ['staff'], staffLevel: 'super_admin' }

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
    let resolveFirst: (account: Account | null) => void = () => {}
    let call = 0
    const racing: SessionSource = {
      load: () => {
        call += 1
        return call === 1 ? new Promise((resolve) => (resolveFirst = resolve)) : Promise.resolve(null)
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

describe('RequireRole', () => {
  it('refuses another role with the catalog message', async () => {
    renderGuarded(source(requester), <RequireRole role="interpreter">secret</RequireRole>)
    expect((await screen.findByRole('alert')).textContent).toBe('Não tens permissão para fazer isto.')
    expect(screen.queryByText('secret')).toBeNull()
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
