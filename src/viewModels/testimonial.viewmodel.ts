import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testimonialUseCase } from '@/domain/usecases/TestimonialUseCase'
import { TestimonialEntity } from '@/core/entities/content/TestimonialEntity'
import { toast } from 'sonner'

export const TESTIMONIAL_KEYS = {
  all: ['testimonials'] as const,
  lists: () => [...TESTIMONIAL_KEYS.all, 'list'] as const,
  list: (filters: string) => [...TESTIMONIAL_KEYS.lists(), { filters }] as const,
  details: () => [...TESTIMONIAL_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TESTIMONIAL_KEYS.details(), id] as const
}

export function useTestimonialViewModel() {
  const queryClient = useQueryClient()

  const getAllTestimonials = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: TESTIMONIAL_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => testimonialUseCase.getAllTestimonials(limit, offset, searchTerm)
    })
  }

  const getTestimonialById = (id: string) => {
    return useQuery({
      queryKey: TESTIMONIAL_KEYS.detail(id),
      queryFn: () => testimonialUseCase.getTestimonialById(id),
      enabled: !!id
    })
  }

  const updateTestimonial = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TestimonialEntity> }) =>
      testimonialUseCase.updateTestimonial(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIAL_KEYS.all })
      queryClient.setQueryData(TESTIMONIAL_KEYS.detail(updatedData.id), updatedData)
      toast.success('Testemunho atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar testemunho', {
        description: error.message
      })
    }
  })

  return {
    getAllTestimonials,
    getTestimonialById,
    updateTestimonial
  }
}
