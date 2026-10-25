import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import rootPackage from '../../../package.json'
import { AdminAppRoutes, App } from './App'
import { navigation } from './navigation'

function renderAt(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminAppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('admin-web routes (new paths, architecture.md §3)', () => {
  it('renders the overview at /', () => {
    renderAt('/')
    expect(screen.getAllByText('Dashboard Administrativo').length).toBeGreaterThan(0)
  })

  it('renders the team page with the preview team (AD-014)', async () => {
    renderAt('/team')
    expect(screen.getAllByText('Gestão de Equipa').length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Rafael Pilartes')).length).toBeGreaterThan(0)
  })

  it('no longer answers on the old /dashboard/admin prefix', () => {
    renderAt('/dashboard/admin/team')
    expect(screen.getByText('Página não encontrada')).toBeTruthy()
  })

  it('serves the login page from packages/auth, without a registration link', () => {
    renderAt('/login')
    expect(screen.getByText('Bem-vindo de volta')).toBeTruthy()
    expect(screen.queryByText('Registe-se aqui')).toBeNull()
  })
})

describe('admin-web sidebar', () => {
  const hrefs = navigation.flatMap((entry) => ('items' in entry ? entry.items.map((item) => item.href) : [entry.href]))

  it.each(hrefs)('sidebar link %s resolves to a screen, not the 404', (href) => {
    renderAt(href)
    expect(screen.queryByText('Página não encontrada')).toBeNull()
  })
})

describe('admin-web App', () => {
  it('shows the monorepo version in the footer', () => {
    render(<App />)
    expect(screen.getByTestId('app-footer').textContent).toContain(`v${rootPackage.version}`)
  })
})
