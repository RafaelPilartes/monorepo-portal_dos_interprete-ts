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
    // Implicit flow: the confirmation email is requested by the API (POST /auth/register), so a
    // PKCE verifier would not be in this browser; the link brings the session in the URL hash.
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit', ...(storage ? { storage } : {}) },
  })
}
