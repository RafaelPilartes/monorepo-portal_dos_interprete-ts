import type { Account, PortalServices } from '@portal-dos-interpretes/auth'
import type { ApiClient } from '@portal-dos-interpretes/data'

// Test doubles for admin-web: services whose session is the given account and whose reads answer
// from in-memory rows per "schema.table".

export type Rows = Record<string, unknown[]>

function fakeClient(rows: Rows) {
  return {
    schema(schemaName: string) {
      return {
        from(table: string) {
          const data = rows[`${schemaName}.${table}`] ?? []
          const builder: Record<string, unknown> = {}
          for (const method of ['select', 'eq', 'or', 'order', 'range', 'gte', 'lte', 'single', 'maybeSingle']) {
            builder[method] = () => builder
          }
          builder.then = (resolve: (value: unknown) => unknown) => resolve({ data, error: null, count: data.length })
          return builder
        },
      }
    },
  }
}

export function fakeServices(account: Account | null, rows: Rows = {}, api: Partial<ApiClient> = {}): PortalServices {
  return {
    client: fakeClient(rows) as unknown as PortalServices['client'],
    auth: { signIn: async () => ({ ok: true }) },
    session: { current: async () => null, onChange: () => () => undefined, signOut: async () => undefined },
    api: api as ApiClient,
    source: { load: async () => account, subscribe: () => () => undefined },
  }
}

export const SUPER_ADMIN: Account = { id: 'a1', email: 'sara@example.ao', fullName: 'Sara Um', roles: ['staff'], staffLevel: 'super_admin' }
export const INTERPRETER: Account = { id: 'a2', email: 'ines@example.ao', fullName: 'Inês', roles: ['interpreter'], staffLevel: null }
