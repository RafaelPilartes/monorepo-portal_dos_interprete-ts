import pg from 'pg'

// The API's one connection to the database. Every unit of work is a transaction that first drops
// to service_role, so the API holds exactly what packages/db/grants/ gives service_role and never
// the privileges of the connection's owner (architecture.md §5).

export type Queryable = Pick<pg.PoolClient, 'query'>

export interface Database {
  /** Runs `work` in one transaction as service_role; commits on success, rolls back on error. */
  transaction<T>(work: (client: Queryable) => Promise<T>): Promise<T>
  close(): Promise<void>
}

export function createDatabase(connectionString: string): Database {
  // Bounded waits: a flood or an unreachable database fails a request in seconds instead of
  // hanging it, and no statement holds a connection forever.
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 15_000,
  })
  // An idle client that loses its connection must not crash the process; the next query reconnects.
  pool.on('error', () => undefined)

  return {
    async transaction(work) {
      const client = await pool.connect()
      let broken = false
      try {
        await client.query('BEGIN')
        await client.query('SET LOCAL ROLE service_role')
        const result = await work(client)
        await client.query('COMMIT')
        return result
      } catch (error) {
        // A connection that cannot even roll back is discarded instead of going back to the pool.
        await client.query('ROLLBACK').catch(() => {
          broken = true
        })
        throw error
      } finally {
        client.release(broken)
      }
    },
    close: () => pool.end(),
  }
}
