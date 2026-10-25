import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('admin-web App', () => {
  it('renders the starting page with the monorepo version in the footer', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Portal dos Intérpretes — painel da equipa a arrancar')
    expect(screen.getByTestId('app-footer').textContent).toContain(`v${__APP_VERSION__}`)
  })
})
