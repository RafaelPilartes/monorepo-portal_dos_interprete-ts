import { describe, expect, it } from 'vitest'
import { receiptLines, receiptPdf } from './receiptPdf.js'

const payload = {
  number: 'RC-2026-000001', kind: 'payment' as const, issued_at: '2026-11-06T10:00:00Z', issued_to: 'Paula (Clínica)',
  description: 'Taxa de verificação', payment_reference: 'PAG-2026-000001', amount_aoa: 114000, base_aoa: 100000, tax_aoa: 14000,
  issuer: 'Academia (teste)', notice: 'Documento não fiscal',
}

describe('receipt PDF (R-PAY-12)', () => {
  it('says what the payload says, with the amounts as stored and "Documento não fiscal"', () => {
    expect(receiptLines(payload)).toEqual(expect.arrayContaining([
      'Recibo de pagamento', 'N.º RC-2026-000001', 'Valor base: 100 000 Kz', 'Imposto: 14 000 Kz', 'Total pago: 114 000 Kz', 'Documento não fiscal',
    ]))
  })

  it('is a one-page PDF with the text in Latin-1 and its parentheses escaped', () => {
    const pdf = receiptPdf(payload)
    expect(pdf.subarray(0, 8).toString('latin1')).toBe('%PDF-1.4')
    const text = pdf.toString('latin1')
    expect(text).toContain('(Documento n\u00e3o fiscal) Tj')
    expect(text).toContain('Paula \\(Cl\u00ednica\\)')
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
  })
})
