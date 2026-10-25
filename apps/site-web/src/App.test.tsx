import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import rootPackage from '../../../package.json'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import { App, SiteRoutes } from './App'

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function renderAt(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SiteRoutes />
        <LocationProbe />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('site-web routes', () => {
  it('renders the home page at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Acesso Universal.')
  })

  it('keeps old /home links working by redirecting to /', () => {
    renderAt('/home')
    expect(screen.getByTestId('location').textContent).toBe('/')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Acesso Universal.')
  })

  it('shows the Portuguese 404 page for an unknown path', () => {
    renderAt('/does-not-exist')
    expect(screen.getByText('Página não encontrada')).toBeTruthy()
  })

  it('sends login and registration to requester-web', () => {
    renderAt('/')
    const entrar = screen.getAllByRole('link', { name: 'Entrar' })[0]
    expect(entrar?.getAttribute('href')).toBe('http://localhost:5171/login')
  })
})

describe('site-web App', () => {
  it('shows the monorepo version in the footer', () => {
    render(<App />)
    expect(screen.getByTestId('app-footer').textContent).toContain(`v${rootPackage.version}`)
  })
})
