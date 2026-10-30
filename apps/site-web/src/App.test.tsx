import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import rootPackage from '../../../package.json'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import { App, SiteRoutes } from './App'
import { SiteDataProvider, type PublicService, type SiteData } from './data/catalog'

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function fakeData(services: PublicService[]): SiteData {
  return { services: { list: async () => ({ data: services, pagination: { limit: null, offset: 0, count: services.length } }), getById: async () => null, getOneByField: async () => null, listenById: () => () => undefined } as unknown as SiteData['services'] }
}

function renderAt(path: string, data: SiteData | null = null) {
  return render(
    <AppProviders>
      <SiteDataProvider data={data}>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SiteRoutes />
          <LocationProbe />
        </MemoryRouter>
      </SiteDataProvider>
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

describe('site-web /services (catalogs.md, criterion 4)', () => {
  it('shows the active services from the database, with the table price', async () => {
    renderAt('/services', fakeData([
      { id: 's1', slug: 'saude', title: 'Saúde', description: 'Consultas e hospitais.', pricing_mode: 'hourly', platform_price_aoa: 15000, icon: 'health', sort: 1 },
      { id: 's2', slug: 'novo-servico', title: 'Serviço novo', description: 'Sem conteúdo do site.', pricing_mode: 'fixed', platform_price_aoa: 25000, icon: null, sort: 2 },
    ]))
    expect(await screen.findByText('Saúde')).toBeTruthy()
    expect(screen.getByText('a partir de 15 000 Kz por hora')).toBeTruthy()
    expect(screen.getByText('25 000 Kz')).toBeTruthy()
    expect(screen.getByText('Consultas médicas')).toBeTruthy()
  })

  it('says when there are no services', async () => {
    renderAt('/services', fakeData([]))
    expect(await screen.findByText('Os serviços disponíveis aparecem aqui em breve.')).toBeTruthy()
  })

  it('says so when the services cannot be read, and offers to try again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failing = fakeData([])
    failing.services.list = async () => { throw new Error('network down') }
    renderAt('/services', failing)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Não foi possível carregar os serviços neste momento.')
    expect(screen.getByRole('button', { name: 'Tentar outra vez' })).toBeTruthy()
  })
})
