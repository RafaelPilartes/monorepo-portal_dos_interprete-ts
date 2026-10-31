import type { ApiClient } from '@portal-dos-interpretes/data'
import type { PortalServices } from '../services/PortalServices'
import type { Account } from '../session/SessionContext'

// Test doubles shared by the apps: services whose session is the given account and whose reads
// answer from in-memory rows per "schema.table".

export type Rows = Record<string, unknown[]>

function fakeClient(rows: Rows) {
  return {
    schema(schemaName: string) {
      return {
        from(table: string) {
          const data = rows[`${schemaName}.${table}`] ?? []
          const builder: Record<string, unknown> = {}
          let one = false
          for (const method of ['select', 'eq', 'or', 'order', 'range', 'gte', 'lte', 'in', 'is', 'neq']) {
            builder[method] = () => builder
          }
          // .single() and .maybeSingle() answer one row, as PostgREST does.
          builder.single = builder.maybeSingle = () => {
            one = true
            return builder
          }
          builder.then = (resolve: (value: unknown) => unknown) =>
            resolve({ data: one ? data[0] ?? null : data, error: null, count: data.length })
          return builder
        },
      }
    },
  }
}

export function fakeServices(account: Account | 'suspended' | null, rows: Rows = {}, api: Partial<ApiClient> = {}): PortalServices {
  return {
    client: fakeClient(rows) as unknown as PortalServices['client'],
    auth: {
      signIn: async () => ({ ok: true }),
      requestPasswordReset: async () => undefined,
      updatePassword: async () => ({ ok: true }),
      resendConfirmation: async () => undefined,
    },
    session: { current: async () => null, onChange: () => () => undefined, signOut: async () => undefined },
    api: api as ApiClient,
    source: { load: async () => account ?? 'anonymous', subscribe: () => () => undefined },
  }
}

/** An account with every field, for tests: pass only what matters. */
export function testAccount(patch: Partial<Account>): Account {
  return {
    id: 'a0', email: 'conta@example.ao', fullName: 'Conta Teste', roles: [], staffLevel: null, organizations: [],
    hasRequesterProfile: false, lastActiveRole: null, intendedRole: null, pendingDocuments: [], ...patch,
  }
}
