import { createPortalServices, type PortalServices } from '@portal-dos-interpretes/auth'

/** The platform services of admin-web, from the environment (.env at the repository root). */
export function createAdminServices(): PortalServices {
  const env = import.meta.env
  return createPortalServices({
    supabaseUrl: env.VITE_SUPABASE_URL ?? '',
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? '',
    apiUrl: env.VITE_API_URL ?? '',
    cookieDomain: env.VITE_COOKIE_DOMAIN || undefined,
  })
}
