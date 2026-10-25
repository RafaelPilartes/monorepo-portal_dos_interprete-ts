import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interpreterPortfolioUseCase } from '@/domain/usecases/InterpreterPortfolioUseCase'
import { InterpreterPortfolioEntity } from '@/core/entities/interpreter/InterpreterPortfolioEntity'
import { toast } from 'sonner'

export const INTERPRETER_PORTFOLIO_KEYS = {
  all: ['interpreter-portfolios'] as const,
  lists: () => [...INTERPRETER_PORTFOLIO_KEYS.all, 'list'] as const,
  byInterpreter: (profileId: string) => [...INTERPRETER_PORTFOLIO_KEYS.lists(), 'interpreter', profileId] as const,
  details: () => [...INTERPRETER_PORTFOLIO_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INTERPRETER_PORTFOLIO_KEYS.details(), id] as const
}

export function useInterpreterPortfolioViewModel() {
  const queryClient = useQueryClient()

  const getPortfoliosByInterpreterId = (interpreterProfileId: string) => {
    return useQuery({
      queryKey: INTERPRETER_PORTFOLIO_KEYS.byInterpreter(interpreterProfileId),
      queryFn: () => interpreterPortfolioUseCase.getPortfoliosByInterpreterId(interpreterProfileId),
      enabled: !!interpreterProfileId
    })
  }

  const updatePortfolio = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterpreterPortfolioEntity> }) =>
      interpreterPortfolioUseCase.updatePortfolio(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: INTERPRETER_PORTFOLIO_KEYS.all })
      queryClient.setQueryData(
        INTERPRETER_PORTFOLIO_KEYS.detail(updatedData.id),
        updatedData
      )
      toast.success('Portfólio atualizado')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar portfólio', {
        description: error.message
      })
    }
  })

  return {
    getPortfoliosByInterpreterId,
    updatePortfolio
  }
}
