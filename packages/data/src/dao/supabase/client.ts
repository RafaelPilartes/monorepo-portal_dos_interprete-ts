import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js'

export interface SupabaseClientOptions {
  url: string
  anonKey: string
  /** Session storage; packages/auth passes the parent-domain cookie storage (ADR-007). */
  storage?: SupportedStorage | undefined
}

/** The one place a Supabase client is created (architecture.md §2, rule 4). */
export function createSupabaseClient({ url, anonKey, storage }: SupabaseClientOptions): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }
  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, ...(storage ? { storage } : {}) },
  })
}
