import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interpreterServiceUseCase } from '@/domain/usecases/InterpreterServiceUseCase'
import { InterpreterServiceEntity } from '@/core/entities/interpreter/InterpreterServiceEntity'
import { toast } from 'sonner'

export const INTERPRETER_SERVICE_KEYS = {
  all: ['interpreter-services'] as const,
  lists: () => [...INTERPRETER_SERVICE_KEYS.all, 'list'] as const,
  byInterpreter: (profileId: string) => [...INTERPRETER_SERVICE_KEYS.lists(), 'interpreter', profileId] as const,
  details: () => [...INTERPRETER_SERVICE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INTERPRETER_SERVICE_KEYS.details(), id] as const
}

export function useInterpreterServiceViewModel() {
  const queryClient = useQueryClient()

  const getServicesByInterpreterId = (interpreterProfileId: string) => {
    return useQuery({
      queryKey: INTERPRETER_SERVICE_KEYS.byInterpreter(interpreterProfileId),
      queryFn: () => interpreterServiceUseCase.getServicesByInterpreterId(interpreterProfileId),
      enabled: !!interpreterProfileId
    })
  }

  const updateService = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterpreterServiceEntity> }) =>
      interpreterServiceUseCase.updateService(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: INTERPRETER_SERVICE_KEYS.all })
      queryClient.setQueryData(
        INTERPRETER_SERVICE_KEYS.detail(updatedData.id),
        updatedData
      )
      toast.success('Serviço atualizado')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar serviço', {
        description: error.message
      })
    }
  })

  return {
    getServicesByInterpreterId,
    updateService
  }
}
