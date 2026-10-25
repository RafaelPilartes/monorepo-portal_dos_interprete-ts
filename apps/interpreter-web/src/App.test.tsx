import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import rootPackage from '../../../package.json'
import { App, InterpreterAppRoutes } from './App'
import { navigation } from './navigation'

function renderAt(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <InterpreterAppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('interpreter-web routes (new paths, architecture.md §3)', () => {
  it('renders the overview at /', () => {
    renderAt('/')
    expect(screen.getAllByText('Olá, Maria!').length).toBeGreaterThan(0)
  })

  it('keeps the documents page reachable under /verification/documents (AD-005)', () => {
    renderAt('/verification/documents')
    expect(screen.getAllByText('Documentos').length).toBeGreaterThan(0)
  })

  it('shows an honest placeholder for areas that have no screen yet (AD-017)', () => {
    renderAt('/library')
    expect(screen.getAllByText('Biblioteca de Recursos').length).toBeGreaterThan(0)
    expect(screen.getByText(/ainda não está disponível/)).toBeTruthy()
  })

  it("opens a colleague's profile inside the interpreter layout", () => {
    renderAt('/interpreters/maria-silva')
    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Intérprete').length).toBeGreaterThan(0)
  })

  it('no longer answers on the old /dashboard/interpreter prefix', () => {
    renderAt('/dashboard/interpreter')
    expect(screen.getByText('Página não encontrada')).toBeTruthy()
  })
})

describe('interpreter-web sidebar', () => {
  const hrefs = navigation.flatMap((entry) => ('items' in entry ? entry.items.map((item) => item.href) : [entry.href]))

  it.each(hrefs)('sidebar link %s resolves to a screen, not the 404', (href) => {
    renderAt(href)
    expect(screen.queryByText('Página não encontrada')).toBeNull()
  })
})

describe('interpreter-web App', () => {
  it('shows the monorepo version in the footer', () => {
    render(<App />)
    expect(screen.getByTestId('app-footer').textContent).toContain(`v${rootPackage.version}`)
  })
})
