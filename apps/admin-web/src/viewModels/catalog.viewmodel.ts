import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRequiredPortalServices } from '@portal-dos-interpretes/auth'
import { useRepositories, type LanguageRow, type ServiceRow, type SpecialtyRow } from '@/data/repositories'

// Catalogs for the team (catalogs.md): reads by RLS (every item, with its usage), writes through
// the API, which owns R-CAT-01 and R-CAT-02. No optimistic update.

export type CatalogKind = 'languages' | 'specialties' | 'services'
export type CatalogRow = LanguageRow | SpecialtyRow | ServiceRow

export function useCatalog(kind: CatalogKind) {
  const repositories = useRepositories()
  return useQuery({
    queryKey: ['catalog', kind],
    queryFn: async (): Promise<CatalogRow[]> => (await repositories[kind].list({ orderBy: 'sort', ascending: true })).data,
  })
}

export function useCatalogMutations(kind: CatalogKind) {
  const { api } = useRequiredPortalServices()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['catalog', kind] })
  return {
    save: useMutation({
      mutationFn: ({ id, values }: { id: string | null; values: Record<string, unknown> }) =>
        id ? api.patch(`/admin/catalog/${kind}/${id}`, values) : api.post(`/admin/catalog/${kind}`, values),
      onSettled: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.delete(`/admin/catalog/${kind}/${id}`), onSettled: refresh }),
  }
}
