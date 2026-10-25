import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewUseCase } from '@/domain/usecases/ReviewUseCase'
import { ReviewEntity } from '@/core/entities/booking/ReviewEntity'
import { toast } from 'sonner'

export const REVIEW_KEYS = {
  all: ['reviews'] as const,
  lists: () => [...REVIEW_KEYS.all, 'list'] as const,
  list: (filters: string) => [...REVIEW_KEYS.lists(), { filters }] as const,
  byInterpreter: (interpreterId: string) => [...REVIEW_KEYS.lists(), 'interpreter', interpreterId] as const,
  details: () => [...REVIEW_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...REVIEW_KEYS.details(), id] as const
}

export function useReviewViewModel() {
  const queryClient = useQueryClient()

  const getAllReviews = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: REVIEW_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => reviewUseCase.getAllReviews(limit, offset, searchTerm)
    })
  }

  const getReviewsByInterpreterId = (interpreterId: string, limit?: number, offset?: number) => {
    return useQuery({
      queryKey: REVIEW_KEYS.byInterpreter(interpreterId),
      queryFn: () => reviewUseCase.getReviewsByInterpreterId(interpreterId, limit, offset),
      enabled: !!interpreterId
    })
  }

  const updateReview = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReviewEntity> }) =>
      reviewUseCase.updateReview(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.all })
      queryClient.setQueryData(REVIEW_KEYS.detail(updatedData.id), updatedData)
      toast.success('Avaliação atualizada')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar avaliação', {
        description: error.message
      })
    }
  })

  return {
    getAllReviews,
    getReviewsByInterpreterId,
    updateReview
  }
}
