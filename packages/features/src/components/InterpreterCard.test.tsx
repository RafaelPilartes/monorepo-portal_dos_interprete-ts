import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TooltipProvider } from '@portal-dos-interpretes/ui/components/tooltip'
import { describe, expect, it } from 'vitest'
import { interpreters } from '../mocks/interpretersMocks'
import { InterpreterCard } from './InterpreterCard'

const interpreter = interpreters[0]!

function renderCard(props: Partial<Parameters<typeof InterpreterCard>[0]> = {}) {
  return render(
    <TooltipProvider>
      <MemoryRouter>
        <InterpreterCard interpreter={interpreter} {...props} />
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('InterpreterCard', () => {
  it('links to the in-app profile route by default', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /Ver Perfil/ })
    expect(link.getAttribute('href')).toBe(`/interpreters/${interpreter.slug}`)
  })

  it('uses profileHref when given (the public site sends visitors to the login)', () => {
    renderCard({ compact: true, profileHref: (slug) => `https://requester.example/login?returnTo=${slug}` })
    const link = screen.getByRole('link', { name: /Ver Perfil/ })
    expect(link.getAttribute('href')).toBe(`https://requester.example/login?returnTo=${interpreter.slug}`)
  })
})
