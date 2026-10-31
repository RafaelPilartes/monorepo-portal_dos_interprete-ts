import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppFooter } from './AppFooter'

describe('AppFooter', () => {
  it('shows the version with a v prefix and the commit', () => {
    render(<AppFooter version="0.2.0" commit="abc1234" />)
    expect(screen.getByTestId('app-footer').textContent).toBe('Versão v0.2.0 · abc1234')
  })
})
