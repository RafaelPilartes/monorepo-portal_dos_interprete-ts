import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { specialtyUseCase } from '@/domain/usecases/SpecialtyUseCase'
import { SpecialtyEntity } from '@/core/entities/platform/SpecialtyEntity'
import { toast } from 'sonner'

export const SPECIALTY_KEYS = {
  all: ['specialties'] as const,
  lists: () => [...SPECIALTY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...SPECIALTY_KEYS.lists(), { filters }] as const,
  details: () => [...SPECIALTY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SPECIALTY_KEYS.details(), id] as const
}

export function useSpecialtyViewModel() {
  const queryClient = useQueryClient()

  const getAllSpecialties = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: SPECIALTY_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => specialtyUseCase.getAllSpecialties(limit, offset, searchTerm)
    })
  }

  const getSpecialtyById = (id: string) => {
    return useQuery({
      queryKey: SPECIALTY_KEYS.detail(id),
      queryFn: () => specialtyUseCase.getSpecialtyById(id),
      enabled: !!id
    })
  }

  const updateSpecialty = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SpecialtyEntity> }) =>
      specialtyUseCase.updateSpecialty(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: SPECIALTY_KEYS.all })
      queryClient.setQueryData(SPECIALTY_KEYS.detail(updatedData.id), updatedData)
      toast.success('Especialidade atualizada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar especialidade', {
        description: error.message
      })
    }
  })

  return {
    getAllSpecialties,
    getSpecialtyById,
    updateSpecialty
  }
}
