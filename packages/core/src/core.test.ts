import { describe, expect, it } from 'vitest'
import {
  APP_NAME,
  ERROR_CATALOG,
  IBAN_AO_PATTERN,
  NIF_PATTERN,
  amountAoaSchema,
  errorFor,
  ibanAoSchema,
  nifSchema,
  normalizePhone,
  phoneSchema,
} from './index'

describe('normalizePhone', () => {
  it.each([
    ['923000000', '+244923000000'],
    ['923 000 000', '+244923000000'],
    ['+244 923-000-000', '+244923000000'],
    ['00244923000000', '+244923000000'],
    ['+351912345678', '+351912345678'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(['', 'abc', '12', '+0123456789', '+2449230000000000'])('rejects %j', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})

describe('patterns', () => {
  it('accept the provisional NIF formats and refuse lowercase or short ones', () => {
    expect(NIF_PATTERN.test('5417000000')).toBe(true)
    expect(NIF_PATTERN.test('004567890LA042')).toBe(true)
    expect(NIF_PATTERN.test('12345678')).toBe(false)
    expect(NIF_PATTERN.test('004567890la042')).toBe(false)
  })

  it('accept only Angolan IBANs of 25 characters', () => {
    expect(IBAN_AO_PATTERN.test('AO06000000000000000000000')).toBe(true)
    expect(IBAN_AO_PATTERN.test('AO0600000000000000000000')).toBe(false)
    expect(IBAN_AO_PATTERN.test('PT50000000000000000000000')).toBe(false)
  })
})

describe('schemas', () => {
  it('phoneSchema outputs E.164 and reports a Portuguese message', () => {
    expect(phoneSchema.parse('923000000')).toBe('+244923000000')
    expect(phoneSchema.safeParse('12').error?.issues[0]?.message).toBe('Telefone inválido.')
  })

  it('nifSchema and ibanAoSchema normalise case and spaces', () => {
    expect(nifSchema.parse(' 004567890la042 ')).toBe('004567890LA042')
    expect(ibanAoSchema.parse('ao06 0000 0000 0000 0000 0000 0')).toBe('AO06000000000000000000000')
  })

  it('amounts are whole kwanzas (D-37)', () => {
    expect(amountAoaSchema.safeParse(14040).success).toBe(true)
    expect(amountAoaSchema.safeParse(14040.5).success).toBe(false)
    expect(amountAoaSchema.safeParse(-1).success).toBe(false)
  })
})

describe('error catalog', () => {
  it('maps a known code to its Portuguese message and field', () => {
    expect(errorFor('INVALID_IBAN')).toEqual({
      code: 'INVALID_IBAN',
      status: 400,
      message: 'IBAN inválido. Um IBAN angolano começa por AO06 e tem 25 caracteres.',
      field: 'iban',
    })
  })

  it('turns an unknown code into INTERNAL_ERROR, never showing technical text', () => {
    expect(errorFor('duplicate key value violates unique constraint').code).toBe('INTERNAL_ERROR')
  })

  it('has the general codes of api.md §2', () => {
    expect(Object.keys(ERROR_CATALOG)).toEqual(expect.arrayContaining(['UNAUTHENTICATED', 'FORBIDDEN', 'INTERNAL_ERROR']))
    expect(APP_NAME).toBe('Portal dos Intérpretes')
  })
})
