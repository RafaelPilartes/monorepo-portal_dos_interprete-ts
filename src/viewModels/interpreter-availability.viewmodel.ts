import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interpreterAvailabilityUseCase } from '@/domain/usecases/InterpreterAvailabilityUseCase'
import { InterpreterAvailabilityEntity } from '@/core/entities/interpreter/InterpreterAvailabilityEntity'
import { toast } from 'sonner'

export const INTERPRETER_AVAILABILITY_KEYS = {
  all: ['interpreter-availabilities'] as const,
  lists: () => [...INTERPRETER_AVAILABILITY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...INTERPRETER_AVAILABILITY_KEYS.lists(), { filters }] as const,
  byInterpreter: (interpreterId: string) => [...INTERPRETER_AVAILABILITY_KEYS.lists(), 'interpreter', interpreterId] as const,
  details: () => [...INTERPRETER_AVAILABILITY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INTERPRETER_AVAILABILITY_KEYS.details(), id] as const
}

export function useInterpreterAvailabilityViewModel() {
  const queryClient = useQueryClient()

  const getAvailabilitiesByInterpreterId = (interpreterId: string) => {
    return useQuery({
      queryKey: INTERPRETER_AVAILABILITY_KEYS.byInterpreter(interpreterId),
      queryFn: () => interpreterAvailabilityUseCase.getAvailabilitiesByInterpreterId(interpreterId),
      enabled: !!interpreterId
    })
  }

  const updateAvailability = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterpreterAvailabilityEntity> }) =>
      interpreterAvailabilityUseCase.updateAvailability(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: INTERPRETER_AVAILABILITY_KEYS.all })
      queryClient.setQueryData(
        INTERPRETER_AVAILABILITY_KEYS.detail(updatedData.id),
        updatedData
      )
      toast.success('Disponibilidade atualizada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar disponibilidade', {
        description: error.message
      })
    }
  })

  return {
    getAvailabilitiesByInterpreterId,
    updateAvailability
  }
}
