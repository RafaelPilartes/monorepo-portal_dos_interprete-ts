import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PortalServicesProvider, SessionProvider, type Account } from '@portal-dos-interpretes/auth'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import rootPackage from '../../../package.json'
import { AdminAppRoutes, App } from './App'
import { navigation } from './navigation'
import { fakeServices, INTERPRETER, SUPER_ADMIN, type Rows } from './testing/fakeServices'

const TEAM: Rows = {
  'identity.staff_directory': [
    { account_id: 'a1', full_name: 'Sara Um', email: 'sara@example.ao', level: 'super_admin', active: true, created_by: null, created_by_name: null, created_at: '2026-10-25T10:00:00Z' },
  ],
}

function renderAt(path: string, account: Account | null = SUPER_ADMIN, rows: Rows = TEAM) {
  const services = fakeServices(account, rows)
  return render(
    <AppProviders>
      <PortalServicesProvider services={services}>
        <SessionProvider source={services.source}>
          <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AdminAppRoutes />
          </MemoryRouter>
        </SessionProvider>
      </PortalServicesProvider>
    </AppProviders>,
  )
}

describe('admin-web routes (new paths, architecture.md §3)', () => {
  it('sends a visitor without a session to /login', async () => {
    renderAt('/team', null)
    expect(await screen.findByText('Bem-vindo de volta')).toBeTruthy()
  })

  it('tells an account outside the team that the area is only for the team', async () => {
    renderAt('/team', INTERPRETER)
    expect(await screen.findByText('Esta área é só para a equipa do Portal')).toBeTruthy()
    expect(screen.getByText('Ir para a minha área').closest('a')?.getAttribute('href')).toBe('http://localhost:5172/')
  })

  it('shows the team from the database to a super_admin', async () => {
    renderAt('/team')
    expect(await screen.findByText('sara@example.ao')).toBeTruthy()
    expect(screen.getByText('Adicionar membro')).toBeTruthy()
  })

  it('no longer answers on the old /dashboard/admin prefix', async () => {
    renderAt('/dashboard/admin/team')
    expect(await screen.findByText('Página não encontrada')).toBeTruthy()
  })

  it('serves the login page from packages/auth, without a registration link', () => {
    renderAt('/login', null)
    expect(screen.getByText('Bem-vindo de volta')).toBeTruthy()
    expect(screen.queryByText('Registe-se aqui')).toBeNull()
  })
})

describe('admin-web sidebar', () => {
  const hrefs = navigation.flatMap((entry) => ('items' in entry ? entry.items.map((item) => item.href) : [entry.href]))

  it.each(hrefs)('sidebar link %s resolves to a screen, not the 404', async (href) => {
    renderAt(href)
    await screen.findAllByText('Sara Um')
    expect(screen.queryByText('Página não encontrada')).toBeNull()
  })
})

describe('admin-web App', () => {
  it('shows the monorepo version in the footer', () => {
    render(<App services={fakeServices(null)} />)
    expect(screen.getByTestId('app-footer').textContent).toContain(`v${rootPackage.version}`)
  })
})
