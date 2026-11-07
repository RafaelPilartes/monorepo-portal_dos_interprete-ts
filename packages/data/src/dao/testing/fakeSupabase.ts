import type { SupabaseClient } from '@supabase/supabase-js'

export interface FakeResult {
  data?: unknown
  error?: { code?: string; message: string } | null
  count?: number | null
}

/** A chainable stand-in for the Supabase query builder that records every call. */
export function fakeSupabase(result: FakeResult) {
  const calls: { method: string; args: unknown[] }[] = []
  const builder: Record<string, unknown> = {}
  const chain = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args })
    return builder
  }
  for (const method of ['select', 'eq', 'or', 'order', 'range', 'insert', 'update', 'single', 'maybeSingle', 'from', 'schema']) {
    builder[method] = chain(method)
  }
  builder.then = (resolve: (value: FakeResult) => unknown) =>
    resolve({ data: result.data ?? null, error: result.error ?? null, count: result.count ?? null })
  const client = { schema: chain('schema') } as unknown as SupabaseClient
  return { client, calls }
}
