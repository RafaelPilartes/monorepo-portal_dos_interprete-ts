import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PortalServicesProvider, SessionProvider, type Account } from '@portal-dos-interpretes/auth'
import { fakeServices, testAccount } from '@portal-dos-interpretes/auth/testing/fakeServices'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import rootPackage from '../../../package.json'
import { App, InterpreterAppRoutes } from './App'
import { navigation } from './navigation'

const INTERPRETER = testAccount({ id: 'i1', fullName: 'Inês Mateus', email: 'ines@example.ao', roles: ['interpreter'] })

function renderAt(path: string, account: Account | null = INTERPRETER) {
  const services = fakeServices(account)
  return render(
    <AppProviders>
      <PortalServicesProvider services={services}>
        <SessionProvider source={services.source}>
          <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <InterpreterAppRoutes />
          </MemoryRouter>
        </SessionProvider>
      </PortalServicesProvider>
    </AppProviders>,
  )
}

describe('interpreter-web routes (new paths, architecture.md §3)', () => {
  it('renders the area with the real name in the header', async () => {
    renderAt('/')
    expect((await screen.findAllByText('Inês Mateus')).length).toBeGreaterThan(0)
  })

  it('sends a visitor to /login', async () => {
    renderAt('/schedule', null)
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeTruthy()
  })

  it('sends an account without the role to the interpreter onboarding when it has no role (R-ACC-01)', async () => {
    renderAt('/', testAccount({ roles: [], intendedRole: 'interpreter' }))
    expect(await screen.findByRole('heading', { name: 'Criar o teu perfil de intérprete' })).toBeTruthy()
  })

  it('offers the switch to a requester-only account, and a role switch to an account with both', async () => {
    renderAt('/', testAccount({ roles: ['requester'] }))
    expect(await screen.findByRole('heading', { name: 'Esta área é para intérpretes' })).toBeTruthy()
    renderAt('/', testAccount({ fullName: 'Duas Vezes', roles: ['requester', 'interpreter'] }))
    expect(await screen.findByRole('button', { name: 'Mudar para solicitante' })).toBeTruthy()
  })

  it('keeps the documents page reachable under /verification/documents (AD-005)', async () => {
    renderAt('/verification/documents')
    expect((await screen.findAllByText('Documentos')).length).toBeGreaterThan(0)
  })

  it('shows an honest placeholder for areas that have no screen yet (AD-017)', async () => {
    renderAt('/library')
    expect((await screen.findAllByText('Biblioteca de Recursos')).length).toBeGreaterThan(0)
    expect(screen.getByText(/ainda não está disponível/)).toBeTruthy()
  })

  it('no longer answers on the old /dashboard/interpreter prefix', async () => {
    renderAt('/dashboard/interpreter')
    expect(await screen.findByText('Página não encontrada')).toBeTruthy()
  })
})

describe('interpreter-web sidebar', () => {
  const hrefs = navigation.flatMap((entry) => ('items' in entry ? entry.items.map((item) => item.href) : [entry.href]))

  it.each(hrefs)('sidebar link %s resolves to a screen, not the 404', async (href) => {
    renderAt(href)
    expect(await screen.findAllByText('Inês Mateus')).toBeTruthy()
    expect(screen.queryByText('Página não encontrada')).toBeNull()
  })
})

describe('interpreter-web App', () => {
  it('shows the monorepo version in the footer', () => {
    render(<App services={fakeServices(null)} />)
    expect(screen.getByTestId('app-footer').textContent).toContain(`v${rootPackage.version}`)
  })
})
