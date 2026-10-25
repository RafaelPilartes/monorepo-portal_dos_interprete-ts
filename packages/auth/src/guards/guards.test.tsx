import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
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

  it('always lets super_admin in', async () => {
    renderGuarded(source(superAdmin), <RequireStaffLevel levels={['moderator']}>reports</RequireStaffLevel>)
    expect(await screen.findByText('reports')).toBeTruthy()
  })
})
