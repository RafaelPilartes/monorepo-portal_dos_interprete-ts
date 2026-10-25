import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentUseCase } from '@/domain/usecases/PaymentUseCase'
import { PaymentEntity } from '@/core/entities/financial/PaymentEntity'
import { toast } from 'sonner'

export const PAYMENT_KEYS = {
  all: ['payments'] as const,
  lists: () => [...PAYMENT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PAYMENT_KEYS.lists(), { filters }] as const,
  details: () => [...PAYMENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PAYMENT_KEYS.details(), id] as const
}

export function usePaymentViewModel() {
  const queryClient = useQueryClient()

  const getAllPayments = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: PAYMENT_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => paymentUseCase.getAllPayments(limit, offset, searchTerm)
    })
  }

  const getPaymentById = (id: string) => {
    return useQuery({
      queryKey: PAYMENT_KEYS.detail(id),
      queryFn: () => paymentUseCase.getPaymentById(id),
      enabled: !!id
    })
  }

  const updatePayment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentEntity> }) =>
      paymentUseCase.updatePayment(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      queryClient.setQueryData(PAYMENT_KEYS.detail(updatedData.id), updatedData)
      toast.success('Pagamento atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar pagamento', {
        description: error.message
      })
    }
  })

  return {
    getAllPayments,
    getPaymentById,
    updatePayment
  }
}
