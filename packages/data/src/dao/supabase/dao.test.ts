import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from '../testing/fakeSupabase'
import { DataError } from '../../domain/errors/DataError'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'
import { ReadOnlyDAO } from './ReadOnlyDAO'

interface InterpreterRow {
  id: string
  display_name: string
  city: string
}

describe('ReadOnlyDAO', () => {
  afterEach(() => vi.restoreAllMocks())

  it('queries the right schema and table, with filters, search, order and page', async () => {
    const { client, calls } = fakeSupabase({ data: [{ id: '1', display_name: 'Ana', city: 'Luanda' }], count: 7 })
    const dao = new ReadOnlyDAO<InterpreterRow>(client, 'directory', 'interpreters', ['display_name'])
    const result = await dao.list({ filters: { city: 'Luanda' }, searchTerm: 'an(a)', orderBy: 'display_name', limit: 5, offset: 5 })

    expect(calls.map((call) => call.method)).toEqual(['schema', 'from', 'select', 'eq', 'or', 'order', 'range'])
    expect(calls[0]?.args).toEqual(['directory'])
    expect(calls[1]?.args).toEqual(['interpreters'])
    expect(calls[4]?.args).toEqual(['display_name.ilike.%an a %'])
    expect(calls[6]?.args).toEqual([5, 9])
    expect(result.pagination).toEqual({ limit: 5, offset: 5, count: 1, total: 7 })
  })

  it('returns null when getById finds no row', async () => {
    const { client } = fakeSupabase({ error: { code: 'PGRST116', message: 'no rows' } })
    await expect(new ReadOnlyDAO<InterpreterRow>(client, 'directory', 'interpreters').getById('x')).resolves.toBeNull()
  })

  it('turns a permission denial into FORBIDDEN', async () => {
    const { client } = fakeSupabase({ error: { code: '42501', message: 'permission denied for table interpreters' } })
    const error = await new ReadOnlyDAO<InterpreterRow>(client, 'directory', 'interpreters').list().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(DataError)
    expect((error as DataError).code).toBe('FORBIDDEN')
    expect((error as DataError).message).toBe('Não tens permissão para fazer isto.')
  })

  it('passes through a catalog code raised by a SQL function (P0001)', async () => {
    const { client } = fakeSupabase({ error: { code: 'P0001', message: 'SCHEDULE_OVERLAP' } })
    const error = (await new ReadOnlyDAO<InterpreterRow>(client, 'booking', 'requests').list().catch((e: unknown) => e)) as DataError
    expect(error.code).toBe('SCHEDULE_OVERLAP')
  })

  it('hides unknown database errors behind INTERNAL_ERROR and logs the real text', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client } = fakeSupabase({ error: { code: '23505', message: 'duplicate key value violates unique constraint "x_key"' } })
    const error = (await new ReadOnlyDAO<InterpreterRow>(client, 'directory', 'interpreters').list().catch((e: unknown) => e)) as DataError
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.message).not.toContain('duplicate key')
    expect(log).toHaveBeenCalledWith(expect.stringContaining('duplicate key value'))
  })
})

describe('BaseSupabaseDAO', () => {
  it('reports a refused column write as FORBIDDEN instead of a success', async () => {
    const { client } = fakeSupabase({ error: { code: '42501', message: 'permission denied for column verified' } })
    const dao = new BaseSupabaseDAO<InterpreterRow>(client, 'directory', 'interpreters')
    await expect(dao.update('1', { city: 'Benguela' })).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('returns the row the database wrote', async () => {
    const { client, calls } = fakeSupabase({ data: { id: '1', display_name: 'Ana', city: 'Benguela' } })
    const dao = new BaseSupabaseDAO<InterpreterRow>(client, 'directory', 'interpreters')
    await expect(dao.update('1', { city: 'Benguela' })).resolves.toMatchObject({ city: 'Benguela' })
    expect(calls.map((call) => call.method)).toEqual(['schema', 'from', 'update', 'eq', 'select', 'single'])
  })
})

describe('translatePostgrestError (review of step E)', () => {
  it('treats an expired JWT as UNAUTHENTICATED', async () => {
    const { client } = fakeSupabase({ error: { code: 'PGRST301', message: 'JWT expired' } })
    await expect(new ReadOnlyDAO<InterpreterRow>(client, 'directory', 'interpreters').list()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})
