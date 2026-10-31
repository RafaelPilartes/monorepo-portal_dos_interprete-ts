import { createPortalServices, type PortalServices } from './PortalServices'

/**
 * The platform services of a panel app, from its environment (.env at the repository root, read
 * by the app's Vite build). Throws when the Supabase variables are missing.
 */
export function createServicesFromEnv(): PortalServices {
  const env = import.meta.env as Record<string, string | undefined>
  return createPortalServices({
    supabaseUrl: env.VITE_SUPABASE_URL ?? '',
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? '',
    apiUrl: env.VITE_API_URL ?? '',
    cookieDomain: env.VITE_COOKIE_DOMAIN || undefined,
  })
}
