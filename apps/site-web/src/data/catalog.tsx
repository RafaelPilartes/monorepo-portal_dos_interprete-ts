import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createSupabaseClient, ReadOnlyDAO, type IReadRepository } from '@portal-dos-interpretes/data'
import type { Tables } from '@portal-dos-interpretes/db-types'

// The public site reads the active catalog as a visitor (RLS: active items only, catalogs.md).

export type PublicService = Pick<Tables<{ schema: 'catalog' }, 'services'>, 'id' | 'slug' | 'title' | 'description' | 'pricing_mode' | 'platform_price_aoa' | 'icon' | 'sort'>

export interface SiteData {
  services: IReadRepository<PublicService>
}

/** The site's reads, from its environment; null when the Supabase variables are missing. */
export function createSiteData(): SiteData | null {
  const env = import.meta.env
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return null
  // No session on the public site: the visitor reads only what anon may read.
  const client = createSupabaseClient({ url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY })
  return { services: new ReadOnlyDAO<PublicService>(client, 'catalog', 'services') }
}

const SiteDataContext = createContext<SiteData | null>(null)

export function SiteDataProvider({ data, children }: { data: SiteData | null; children: ReactNode }) {
  return <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>
}

/** The active services in their order (site-web /services). */
export function useActiveServices() {
  const data = useContext(SiteDataContext)
  return useQuery({
    queryKey: ['site', 'services'],
    queryFn: async (): Promise<PublicService[]> => {
      if (!data) throw new Error('site data is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
      return (await data.services.list({ orderBy: 'sort', ascending: true })).data
    },
  })
}
