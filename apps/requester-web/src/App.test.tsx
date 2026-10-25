import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import rootPackage from '../../../package.json'
import { App, RequesterAppRoutes } from './App'
import { navigation } from './navigation'

function renderAt(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RequesterAppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('requester-web routes (new paths, architecture.md §3)', () => {
  it('renders the overview at /', () => {
    renderAt('/')
    expect(screen.getAllByText('Bem-vindo, João!').length).toBeGreaterThan(0)
  })

  it('opens an interpreter profile inside the requester layout (D-05, AD-015)', () => {
    renderAt('/interpreters/maria-silva')
    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Solicitante').length).toBeGreaterThan(0)
  })

  it('serves login and registration from packages/auth, the targets of the site links (AD-013)', () => {
    renderAt('/login')
    expect(screen.getByText('Bem-vindo de volta')).toBeTruthy()
    expect(screen.getByText('Registe-se aqui').closest('a')?.getAttribute('href')).toBe('/register')
  })

  it('no longer answers on the old /dashboard/requester prefix', () => {
    renderAt('/dashboard/requester')
    expect(screen.getByText('Página não encontrada')).toBeTruthy()
  })
})

describe('requester-web sidebar', () => {
  const hrefs = navigation.flatMap((entry) => ('items' in entry ? entry.items.map((item) => item.href) : [entry.href]))

  it.each(hrefs)('sidebar link %s resolves to a screen, not the 404', (href) => {
    renderAt(href)
    expect(screen.queryByText('Página não encontrada')).toBeNull()
  })
})

describe('requester-web App', () => {
  it('shows the monorepo version in the footer', () => {
    render(<App />)
    expect(screen.getByTestId('app-footer').textContent).toContain(`v${rootPackage.version}`)
  })
})
