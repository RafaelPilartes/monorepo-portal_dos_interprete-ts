import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildServer } from '../server.js'
import { lastMigration } from '../lib/migrations.js'
import { fakeDatabase } from '../testing/fakes.js'

const rootVersion: string = JSON.parse(readFileSync(new URL('../../../../package.json', import.meta.url), 'utf8')).version

async function health(db?: ReturnType<typeof fakeDatabase>) {
  const app = await buildServer({ commit: 'abc1234', migrationInBuild: '0002-next.sql', ...(db ? { db } : {}) })
  const response = await app.inject({ method: 'GET', url: '/health' })
  await app.close()
  return response
}

describe('GET /health', () => {
  it('is ok when the database has exactly the build migration', async () => {
    const response = await health(fakeDatabase(() => ({ rows: [{ name: '0002-next.sql' }] })))
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ok', version: rootVersion, commit: 'abc1234', migration_in_build: '0002-next.sql', migration_in_database: '0002-next.sql',
    })
  })

  it('is degraded (503) when a migration is missing in the database', async () => {
    const response = await health(fakeDatabase(() => ({ rows: [{ name: '0001-foundation.sql' }] })))
    expect(response.statusCode).toBe(503)
    expect(response.json()).toMatchObject({ status: 'degraded', migration_in_database: '0001-foundation.sql' })
  })

  it('is degraded when the database does not answer or is not configured', async () => {
    const down = await health(fakeDatabase(() => { throw new Error('connection refused') }))
    expect(down.statusCode).toBe(503)
    expect(down.json()).toMatchObject({ status: 'degraded', migration_in_database: null })
    expect((await health()).statusCode).toBe(503)
  })
})

describe('lastMigration', () => {
  it('takes the highest numbered migration and ignores other files', () => {
    expect(lastMigration(['0002-b.sql', '0010-c.sql', '0001-a.sql', 'README.md', '.gitkeep'])).toBe('0010-c.sql')
    expect(lastMigration([])).toBeNull()
  })
})
