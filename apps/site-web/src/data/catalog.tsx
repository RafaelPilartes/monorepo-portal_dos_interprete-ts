import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createSupabaseClient, ReadOnlyDAO, type IReadRepository } from '@portal-dos-interpretes/data'
import type { Tables } from '@portal-dos-interpretes/db-types'
import { DirectoryProvider } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { DirectoryRepository } from '@portal-dos-interpretes/features/directory/data'

// The public site reads as a visitor: the active catalog (catalogs.md) and the public listing of
// the directory (directory.public_listing, R-DIR-04).

export type PublicService = Pick<Tables<{ schema: 'catalog' }, 'services'>, 'id' | 'slug' | 'title' | 'description' | 'pricing_mode' | 'platform_price_aoa' | 'icon' | 'sort'>

export interface SiteData {
  services: IReadRepository<PublicService>
  /** null in tests that do not read the directory. */
  directory: DirectoryRepository | null
}

/** The site's reads, from its environment; null when the Supabase variables are missing. */
export function createSiteData(): SiteData | null {
  const env = import.meta.env
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return null
  // No session on the public site: the visitor reads only what anon may read.
  const client = createSupabaseClient({ url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY })
  return { services: new ReadOnlyDAO<PublicService>(client, 'catalog', 'services'), directory: new DirectoryRepository(client) }
}

const SiteDataContext = createContext<SiteData | null>(null)

export function SiteDataProvider({ data, children }: { data: SiteData | null; children: ReactNode }) {
  const content = <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>
  // A visitor marks no favorites (R-DIR-10).
  return data?.directory ? <DirectoryProvider repository={data.directory} accountId={null} canFavorite={false}>{content}</DirectoryProvider> : content
}

/** Whether the directory can be read (the site's environment has the Supabase variables). */
export function useHasDirectory(): boolean {
  return useContext(SiteDataContext)?.directory != null
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
