import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PortalServicesProvider, SessionProvider, type Account } from '@portal-dos-interpretes/auth'
import { fakeServices, testAccount, type Rows } from '@portal-dos-interpretes/auth/testing/fakeServices'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import rootPackage from '../../../package.json'
import { App, RequesterAppRoutes } from './App'
import { navigation } from './navigation'

const REQUESTER = testAccount({ id: 'r1', fullName: 'Joana Pedro', email: 'joana@example.ao', roles: ['requester'], hasRequesterProfile: true })
const OWNER = testAccount({
  id: 'o1', fullName: 'Olga Dona', email: 'olga@empresa.ao', roles: ['requester'],
  organizations: [{ id: 'org1', name: 'Clínica Sol', role: 'owner', status: 'active' }],
})
const ORG_ROWS: Rows = {
  'identity.organizations': [{ id: 'org1', name: 'Clínica Sol', nif: '5417000001', sector: 'Saúde', city: 'Luanda', phone: null, address: null, website_url: null, status: 'active' }],
  'identity.organization_member_directory': [
    { organization_id: 'org1', account_id: 'o1', full_name: 'Olga Dona', email: 'olga@empresa.ao', role: 'owner', status: 'active', joined_at: '2026-10-20T10:00:00Z', removed_at: null },
  ],
  'identity.organization_invites': [],
}

function renderAt(path: string, account: Account | null = REQUESTER, rows: Rows = {}) {
  const services = fakeServices(account, rows)
  return render(
    <AppProviders>
      <PortalServicesProvider services={services}>
        <SessionProvider source={services.source}>
          <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <RequesterAppRoutes />
          </MemoryRouter>
        </SessionProvider>
      </PortalServicesProvider>
    </AppProviders>,
  )
}

describe('requester-web routes (architecture.md §3, accounts-and-organizations.md)', () => {
  it('sends a visitor to /login (D-05)', async () => {
    renderAt('/requests', null)
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeTruthy()
    expect(screen.getByText('Criar conta').closest('a')?.getAttribute('href')).toBe(`/register?returnTo=${encodeURIComponent('/requests')}`)
  })

  it('shows the requester area with the real name in the header', async () => {
    renderAt('/')
    expect((await screen.findAllByText('Joana Pedro')).length).toBeGreaterThan(0)
  })

  it('sends an account without any role to the onboarding (R-ACC-01)', async () => {
    renderAt('/', testAccount({ roles: [] }))
    expect(await screen.findByRole('heading', { name: 'Pedir intérpretes como particular' })).toBeTruthy()
  })

  it('offers an interpreter the switch instead of the requester area (R-ACC-04)', async () => {
    renderAt('/', testAccount({ roles: ['interpreter'] }))
    expect(await screen.findByRole('heading', { name: 'Esta área é para quem pede intérpretes' })).toBeTruthy()
  })

  it('shows the organisation to its owner, editable, and its members', async () => {
    renderAt('/organization', OWNER, ORG_ROWS)
    expect(await screen.findByRole('heading', { name: 'Clínica Sol' })).toBeTruthy()
    expect(await screen.findByDisplayValue('Saúde')).toBeTruthy()
    renderAt('/organization/members', OWNER, ORG_ROWS)
    expect(await screen.findByText('olga@empresa.ao')).toBeTruthy()
    expect(screen.getByText('Ainda não convidaste ninguém.')).toBeTruthy()
  })

  it('invites to create an organisation when the account has none', async () => {
    renderAt('/organization')
    expect(await screen.findByText('Ainda não fazes parte de nenhuma organização.')).toBeTruthy()
  })

  it('no longer answers on the old /dashboard/requester prefix', async () => {
    renderAt('/dashboard/requester')
    expect(await screen.findByText('Página não encontrada')).toBeTruthy()
  })
})

describe('requester-web sidebar', () => {
  const hrefs = navigation.flatMap((entry) => ('items' in entry ? entry.items.map((item) => item.href) : [entry.href]))

  it.each(hrefs)('sidebar link %s resolves to a screen, not the 404', async (href) => {
    renderAt(href, OWNER, ORG_ROWS)
    expect(await screen.findAllByText('Olga Dona')).toBeTruthy()
    expect(screen.queryByText('Página não encontrada')).toBeNull()
  })
})

describe('requester-web App', () => {
  it('shows the monorepo version in the footer', () => {
    render(<App services={fakeServices(null)} />)
    expect(screen.getByTestId('app-footer').textContent).toContain(`v${rootPackage.version}`)
  })
})
