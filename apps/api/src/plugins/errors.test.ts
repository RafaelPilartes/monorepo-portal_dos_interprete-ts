import { afterAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { catalogMessage } from '@portal-dos-interpretes/core/errors'
import Fastify from 'fastify'
import { ApiError } from '../lib/sendApiError.js'
import { codeForDatabaseError } from '../lib/dbErrors.js'
import { registerErrorHandling } from './errors.js'

function databaseError(code: string, message: string, extra: Record<string, unknown> = {}) {
  return Object.assign(new Error(message), { code, severity: 'ERROR', ...extra })
}

describe('error handling', () => {
  const logged: unknown[] = []
  const server = Fastify({ logger: { level: 'info', stream: { write: (line: string) => logged.push(line) } } })
  registerErrorHandling(server)
  server.get('/api-error', async () => { throw new ApiError('FILE_INVALID', { reason: 'tem de ser PDF' }) })
  server.post('/validate', async (request) => z.object({ phone: z.string().regex(/^\+/, catalogMessage('INVALID_PHONE')), age: z.number() }).parse(request.body))
  server.get('/rule', async () => { throw databaseError('P0001', 'STATE_CHANGED') })
  server.get('/unknown-db', async () => { throw databaseError('22012', 'division by zero') })
  server.get('/crash', async () => { throw new Error('secret internal detail') })
  afterAll(() => server.close())

  it('sends an ApiError with the catalog message, field and filled placeholders', async () => {
    const response = await server.inject({ method: 'GET', url: '/api-error' })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      error: { code: 'FILE_INVALID', message: 'Ficheiro inválido: tem de ser PDF.', field: 'file', params: { reason: 'tem de ser PDF' } },
    })
  })

  it('turns a validation error into VALIDATION_FAILED with Portuguese details per field', async () => {
    const response = await server.inject({ method: 'POST', url: '/validate', payload: { phone: '923', age: 'x' } })
    expect(response.statusCode).toBe(400)
    const { error } = response.json()
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.details.phone).toBe(catalogMessage('INVALID_PHONE'))
    // zod's own English message never reaches the screen.
    expect(error.details.age).toBe(catalogMessage('VALIDATION_FAILED'))
  })

  it('passes a rule refusal raised by SQL (P0001 + catalog code)', async () => {
    const response = await server.inject({ method: 'GET', url: '/rule' })
    expect(response.statusCode).toBe(409)
    expect(response.json().error.code).toBe('STATE_CHANGED')
  })

  it('hides an unknown database error behind INTERNAL_ERROR and logs the real text', async () => {
    const response = await server.inject({ method: 'GET', url: '/unknown-db' })
    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: catalogMessage('INTERNAL_ERROR'), field: null } })
    expect(response.body).not.toContain('division')
    expect(logged.join('')).toContain('division by zero')
  })

  it('hides an unexpected exception behind INTERNAL_ERROR', async () => {
    const response = await server.inject({ method: 'GET', url: '/crash' })
    expect(response.statusCode).toBe(500)
    expect(response.body).not.toContain('secret')
  })

  it('answers a body that does not parse with VALIDATION_FAILED and an unknown route with NOT_FOUND', async () => {
    const bad = await server.inject({ method: 'POST', url: '/validate', headers: { 'content-type': 'application/json' }, payload: '{nope' })
    expect(bad.statusCode).toBe(400)
    expect(bad.json().error.code).toBe('VALIDATION_FAILED')
    const missing = await server.inject({ method: 'GET', url: '/nowhere' })
    expect(missing.statusCode).toBe(404)
    expect(missing.json().error.code).toBe('NOT_FOUND')
  })
})

describe('codeForDatabaseError', () => {
  it('maps rule codes, permission, concurrency and nothing else', () => {
    expect(codeForDatabaseError({ code: 'P0001', message: 'TOPIC_LOCKED' })).toBe('TOPIC_LOCKED')
    expect(codeForDatabaseError({ code: 'P0001', message: 'not a catalog code' })).toBe('INTERNAL_ERROR')
    expect(codeForDatabaseError({ code: '42501', message: 'permission denied' })).toBe('FORBIDDEN')
    expect(codeForDatabaseError({ code: '40001', message: 'could not serialize' })).toBe('STATE_CHANGED')
    expect(codeForDatabaseError({ code: '23505', message: 'duplicate', constraint: 'unknown_key' })).toBe('INTERNAL_ERROR')
  })
})
