import { describe, expect, it } from 'vitest'
import { answerForDatabaseError } from './dbErrors.js'

describe('answerForDatabaseError', () => {
  it('turns a SQL refusal with a field hint into VALIDATION_FAILED on that field', () => {
    const answer = answerForDatabaseError({ code: 'P0001', message: 'VALIDATION_FAILED', hint: 'email:already_member' }, 'Há campos por corrigir.')
    expect(answer).toEqual({ code: 'VALIDATION_FAILED', details: { email: 'Esta pessoa já é membro da organização.' } })
  })

  it('uses the generic field message for an unknown reason, and ignores a malformed hint', () => {
    expect(answerForDatabaseError({ code: 'P0001', message: 'VALIDATION_FAILED', hint: 'reason:whatever' }, 'Genérica.'))
      .toEqual({ code: 'VALIDATION_FAILED', details: { reason: 'Genérica.' } })
    expect(answerForDatabaseError({ code: 'P0001', message: 'VALIDATION_FAILED', hint: 'not a hint' }, 'Genérica.'))
      .toEqual({ code: 'VALIDATION_FAILED' })
  })

  it('maps the duplicate NIF of an organisation to NIF_IN_USE', () => {
    expect(answerForDatabaseError({ code: '23505', constraint: 'organizations_nif_key' }, 'x')).toEqual({ code: 'NIF_IN_USE' })
  })
})
