import { createContext, useContext, type ReactNode } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { InterpreterCardData } from '../components/InterpreterCard'
import { errorMessage } from '../lib/errorText'
import type { DirectoryRepository, ListingQuery, ListingRow } from './data'

// The directory for any app: the repository (built by the app from its Supabase client) and, in
// the panel apps, the signed-in account that marks favorites.

interface DirectoryContextValue {
  repository: DirectoryRepository
  /** The signed-in account, or null on the public site. */
  accountId: string | null
  /** Whether this account may mark favorites (a requester, R-DIR-10). */
  canFavorite: boolean
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null)

export function DirectoryProvider({ children, ...value }: DirectoryContextValue & { children: ReactNode }) {
  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}

export function useDirectory(): DirectoryContextValue {
  const value = useContext(DirectoryContext)
  if (!value) throw new Error('useDirectory needs a DirectoryProvider')
  return value
}

export function toCard(row: ListingRow, repository: DirectoryRepository): InterpreterCardData {
  return {
    slug: row.slug ?? '',
    name: row.full_name ?? '',
    photoUrl: repository.publicUrl('avatars', row.avatar_path),
    city: row.city,
    modality: row.modality,
    languages: row.language_names ?? [],
    specialties: row.specialty_names ?? [],
    verified: row.is_verified === true,
    ratingAverage: row.rating_average === null ? null : Number(row.rating_average),
    ratingCount: row.rating_count ?? 0,
  }
}

export const directoryKeys = {
  listing: (query: ListingQuery) => ['directory', 'listing', query] as const,
  catalog: ['directory', 'catalog'] as const,
  details: (slug: string) => ['directory', 'details', slug] as const,
  favorites: ['directory', 'favorites'] as const,
  favoriteIds: ['directory', 'favorite-ids'] as const,
}

export function useListing(query: ListingQuery) {
  const { repository } = useDirectory()
  return useQuery({ queryKey: directoryKeys.listing(query), queryFn: () => repository.listing(query), placeholderData: keepPreviousData })
}

export function useDirectoryCatalog() {
  const { repository } = useDirectory()
  return useQuery({ queryKey: directoryKeys.catalog, queryFn: () => repository.catalog(), staleTime: 5 * 60_000 })
}

export function useInterpreterDetails(slug: string) {
  const { repository } = useDirectory()
  return useQuery({ queryKey: directoryKeys.details(slug), queryFn: () => repository.details({ slug }) })
}

export function useFavorites() {
  const { repository, canFavorite } = useDirectory()
  return useQuery({ queryKey: directoryKeys.favorites, queryFn: () => repository.favorites(), enabled: canFavorite })
}

/** The favorite marks of the signed-in requester and the toggle; null where favorites do not apply. */
export function useFavoriteToggle() {
  const { repository, accountId, canFavorite } = useDirectory()
  const queryClient = useQueryClient()
  const ids = useQuery({ queryKey: directoryKeys.favoriteIds, queryFn: () => repository.favoriteIds(), enabled: canFavorite && accountId !== null })
  const toggle = useMutation({
    mutationFn: ({ interpreterId, favorite }: { interpreterId: string; favorite: boolean }) =>
      repository.setFavorite(accountId ?? '', interpreterId, favorite),
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: directoryKeys.favoriteIds })
      void queryClient.invalidateQueries({ queryKey: directoryKeys.favorites })
    },
  })
  if (!canFavorite || !accountId) return null
  return { ids: ids.data ?? new Set<string>(), toggle }
}
