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
  paramsFromMessage,
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

  it('adds +244 to an Angolan fixed number (starts with 2)', () => {
    expect(normalizePhone('222 000 000')).toBe('+244222000000')
  })

  it.each(['', 'abc', '12', '+0123456789', '+2449230000000000', '123456789', '5123456789'])('rejects %j instead of guessing a country', (input) => {
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
    expect(phoneSchema.safeParse('12').error?.issues[0]?.message).toBe('Número de telefone inválido. Usa o formato 923 000 000.')
  })

  it('nifSchema and ibanAoSchema normalise case and spaces', () => {
    expect(nifSchema.parse(' 004567890la042 ')).toBe('004567890LA042')
    expect(ibanAoSchema.parse('ao06 0000 0000 0000 0000 0000 0')).toBe('AO06000000000000000000000')
  })

  it('amounts are whole kwanzas above zero (D-37, INVALID_AMOUNT)', () => {
    expect(amountAoaSchema.safeParse(14040).success).toBe(true)
    expect(amountAoaSchema.safeParse(14040.5).success).toBe(false)
    expect(amountAoaSchema.safeParse(0).success).toBe(false)
    expect(amountAoaSchema.safeParse(1e300).success).toBe(false)
  })

  it('every schema message is the catalog text in Portuguese, including wrong types', () => {
    const amount = 'Indica um valor maior que zero, em kwanzas.'
    expect(amountAoaSchema.safeParse(-5).error?.issues[0]?.message).toBe(amount)
    expect(amountAoaSchema.safeParse('100').error?.issues[0]?.message).toBe(amount)
    expect(ibanAoSchema.safeParse(42).error?.issues[0]?.message).toBe(
      'IBAN inválido. Um IBAN angolano começa por AO06 e tem 25 caracteres.',
    )
    expect(nifSchema.safeParse('x').error?.issues[0]?.message).toBe('NIF inválido.')
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

  it('fills placeholders, and never shows raw braces when a value is missing', () => {
    expect(errorFor('START_TOO_SOON', { min: 60 }).message).toBe('O serviço tem de começar pelo menos 60 minutos a partir de agora.')
    expect(errorFor('START_TOO_SOON').message).toBe('O serviço tem de começar pelo menos … minutos a partir de agora.')
  })

  it('reads placeholder values back only from text that follows the catalog template', () => {
    expect(paramsFromMessage('START_TOO_SOON', 'O serviço tem de começar pelo menos 60 minutos a partir de agora.')).toEqual({ min: '60' })
    expect(paramsFromMessage('START_TOO_SOON', 'ERROR: relation "x" does not exist')).toBeNull()
  })

  it('turns an unknown code into INTERNAL_ERROR, never showing technical text', () => {
    expect(errorFor('duplicate key value violates unique constraint').code).toBe('INTERNAL_ERROR')
  })

  it('has the general codes of api.md §2', () => {
    expect(Object.keys(ERROR_CATALOG)).toEqual(expect.arrayContaining(['UNAUTHENTICATED', 'FORBIDDEN', 'INTERNAL_ERROR']))
    expect(APP_NAME).toBe('Portal dos Intérpretes')
  })
})
