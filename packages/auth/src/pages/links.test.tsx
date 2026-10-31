import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Login from './Login'
import RecoverPassword from './RecoverPassword'
import Register from './Register'
import { PortalServicesProvider } from '../services/PortalServices'
import { fakeServices } from '../testing/fakeServices'

function renderPage(page: React.ReactElement) {
  return render(<PortalServicesProvider services={fakeServices(null)}><MemoryRouter>{page}</MemoryRouter></PortalServicesProvider>)
}

describe('entry pages links (AD-012)', () => {
  it('login: the logo goes to the public site and "register" stays in the app', () => {
    renderPage(<Login />)
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(links).toContain('http://localhost:5170/')
    expect(links).toContain('/register')
    expect(links).not.toContain('/home/register')
  })

  it('login: the registration link can be hidden (admin-web)', () => {
    renderPage(<Login registerHref={null} />)
    expect(screen.queryByText('Criar conta')).toBeNull()
  })

  it('register: "login" stays in the app', () => {
    renderPage(<Register />)
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(links).toContain('/login')
    expect(links).not.toContain('/home/login')
  })

  it('recover password: the logo goes to the public site', () => {
    renderPage(<RecoverPassword />)
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(links).toContain('http://localhost:5170/')
    expect(links).not.toContain('/portal-interpretes')
  })
})
