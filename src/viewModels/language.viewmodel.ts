import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { languageUseCase } from '@/domain/usecases/LanguageUseCase'
import { LanguageEntity } from '@/core/entities/platform/LanguageEntity'
import { toast } from 'sonner'

export const LANGUAGE_KEYS = {
  all: ['languages'] as const,
  lists: () => [...LANGUAGE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...LANGUAGE_KEYS.lists(), { filters }] as const,
  details: () => [...LANGUAGE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...LANGUAGE_KEYS.details(), id] as const
}

export function useLanguageViewModel() {
  const queryClient = useQueryClient()

  const getAllLanguages = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: LANGUAGE_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => languageUseCase.getAllLanguages(limit, offset, searchTerm)
    })
  }

  const getLanguageById = (id: string) => {
    return useQuery({
      queryKey: LANGUAGE_KEYS.detail(id),
      queryFn: () => languageUseCase.getLanguageById(id),
      enabled: !!id
    })
  }

  const updateLanguage = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LanguageEntity> }) =>
      languageUseCase.updateLanguage(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: LANGUAGE_KEYS.all })
      queryClient.setQueryData(LANGUAGE_KEYS.detail(updatedData.id), updatedData)
      toast.success('Idioma atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar idioma', {
        description: error.message
      })
    }
  })

  return {
    getAllLanguages,
    getLanguageById,
    updateLanguage
  }
}
