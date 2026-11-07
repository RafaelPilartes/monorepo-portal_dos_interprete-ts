import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FileUpload } from './components/file-upload'
import { MoneyAmount } from './components/money-amount'
import { PaginationBar } from './components/pagination-bar'
import { StatusBadge } from './components/status-badge'

describe('StatusBadge', () => {
  it('shows the Portuguese label of a known status', () => {
    render(<StatusBadge status="approved" />)
    expect(screen.getByText('Aprovado')).toBeTruthy()
  })

  it('shows "Estado desconhecido" and warns instead of crashing on an unknown status (04-gaps item 7)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<StatusBadge status="accepted" />)
    expect(screen.getByText('Estado desconhecido')).toBeTruthy()
    expect(warn).toHaveBeenCalledWith('StatusBadge: unknown status "accepted"')
    warn.mockRestore()
  })
})

describe('MoneyAmount', () => {
  it('formats whole kwanzas', () => {
    render(<MoneyAmount amount={14040} />)
    expect(screen.getByTestId('money-amount').textContent).toBe('14 040 Kz')
  })
})

describe('FileUpload', () => {
  const pdf = (bytes: number) => new File([new Uint8Array(bytes)], 'bi.pdf', { type: 'application/pdf' })

  it('hands over a file of an accepted type and size', () => {
    const onSelect = vi.fn()
    const { container } = render(<FileUpload label="Escolher" accept={['application/pdf']} maxBytes={1000} onSelect={onSelect} />)
    fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [pdf(10)] } })
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('refuses a file that is too large, with a Portuguese message, and does not hand it over', () => {
    const onSelect = vi.fn()
    const { container } = render(<FileUpload label="Escolher" accept={['application/pdf']} maxBytes={1024} onSelect={onSelect} />)
    fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [pdf(4096)] } })
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe('O ficheiro é demasiado grande. O máximo é 1 KB.')
  })

  it('refuses a type that is not accepted', () => {
    const onSelect = vi.fn()
    const { container } = render(<FileUpload label="Escolher" accept={['image/jpeg']} maxBytes={1000} onSelect={onSelect} />)
    fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [pdf(10)] } })
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe('Este tipo de ficheiro não é aceite.')
  })
})

describe('PaginationBar', () => {
  it('is hidden with a single page and moves between pages otherwise', () => {
    const onPageChange = vi.fn()
    const { container, rerender } = render(<PaginationBar page={1} pageCount={1} onPageChange={onPageChange} />)
    expect(container.textContent).toBe('')
    rerender(<PaginationBar page={2} pageCount={3} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('Seguinte'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})

describe('MoneyAmount with a wrong amount', () => {
  it('says the value is unavailable instead of blanking the screen', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<MoneyAmount amount={10.5} />)
    expect(screen.getByTestId('money-amount').textContent).toBe('Valor indisponível')
    log.mockRestore()
  })
})
