import { describe, expect, it } from 'vitest'
import { translatePostgrestError } from './translatePostgrestError'

// Direct writes (RLS + column grants) refuse values like the API does: same code, same field
// (review of H2, finding 2).
describe('translatePostgrestError for refused values', () => {
  it('a phone outside util.phone_e164 is INVALID_PHONE on the phone field', () => {
    const error = translatePostgrestError({ code: '23514', message: 'value for domain util.phone_e164 violates check constraint "phone_e164_check"' }, 'identity.organizations')
    expect(error.code).toBe('INVALID_PHONE')
    expect(error.field).toBe('phone')
  })

  it('a column check names its column as the field', () => {
    const error = translatePostgrestError({ code: '23514', message: 'new row for relation "organizations" violates check constraint "organizations_website_url_check"' }, 'identity.organizations')
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(Object.keys(error.details ?? {})).toEqual(['website_url'])
  })

  it('an empty required value is "Preenche este campo." on its field (H4)', () => {
    const error = translatePostgrestError({ code: '23502', message: 'null value in column "price_aoa" of relation "interpreter_services" violates not-null constraint' }, 'directory.interpreter_services')
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.details).toEqual({ price_aoa: 'Preenche este campo.' })
  })

  it('anything else stays INTERNAL_ERROR', () => {
    const log = console.error
    console.error = () => undefined
    expect(translatePostgrestError({ code: 'XX000', message: 'boom' }, 'x').code).toBe('INTERNAL_ERROR')
    console.error = log
  })
})
