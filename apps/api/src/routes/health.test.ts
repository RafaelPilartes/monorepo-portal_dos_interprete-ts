import { readFileSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { buildServer } from '../server.js'

const rootVersion: string = JSON.parse(
  readFileSync(new URL('../../../../package.json', import.meta.url), 'utf8'),
).version

describe('GET /health', () => {
  const server = buildServer({ commit: 'abc1234' })
  afterAll(() => server.close())

  it('reports status, version, commit and migration placeholders', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ok',
      version: rootVersion,
      commit: 'abc1234',
      migration_in_build: null,
      migration_in_database: null,
    })
  })

  it('answers unknown routes with 404', async () => {
    const response = await server.inject({ method: 'GET', url: '/nope' })
    expect(response.statusCode).toBe(404)
  })
})
