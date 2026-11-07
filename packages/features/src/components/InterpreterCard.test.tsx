import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TooltipProvider } from '@portal-dos-interpretes/ui/components/tooltip'
import { describe, expect, it, vi } from 'vitest'
import { InterpreterCard, type InterpreterCardData } from './InterpreterCard'

const interpreter: InterpreterCardData = {
  slug: 'maria-santos', name: 'Maria Santos', photoUrl: null, city: 'Luanda', modality: 'both',
  languages: ['Língua Gestual Angolana', 'Português'], specialties: ['Saúde'], verified: false, ratingAverage: null, ratingCount: 0,
}

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
    expect(screen.getByRole('link', { name: /Ver Perfil/ }).getAttribute('href')).toBe('/interpreters/maria-santos')
  })

  it('uses profileHref when given (the public site sends visitors to the login)', () => {
    renderCard({ compact: true, profileHref: (slug) => `https://requester.example/login?returnTo=${slug}` })
    expect(screen.getByRole('link', { name: /Ver Perfil/ }).getAttribute('href')).toBe('https://requester.example/login?returnTo=maria-santos')
  })

  it('says "Ainda sem avaliações" instead of a zero rating (R-DIR-05)', () => {
    renderCard()
    expect(screen.getByText('Ainda sem avaliações')).toBeTruthy()
    expect(screen.queryByText('0,0')).toBeNull()
  })

  it('toggles the favorite (R-DIR-10)', () => {
    const onToggle = vi.fn()
    renderCard({ favorite: { marked: true, onToggle } })
    fireEvent.click(screen.getByRole('button', { name: 'Remover Maria Santos dos favoritos' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
