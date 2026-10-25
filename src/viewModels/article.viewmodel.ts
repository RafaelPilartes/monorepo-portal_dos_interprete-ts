import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { articleUseCase } from '@/domain/usecases/ArticleUseCase'
import { ArticleEntity } from '@/core/entities/content/ArticleEntity'
import { toast } from 'sonner'

export const ARTICLE_KEYS = {
  all: ['articles'] as const,
  lists: () => [...ARTICLE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...ARTICLE_KEYS.lists(), { filters }] as const,
  details: () => [...ARTICLE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ARTICLE_KEYS.details(), id] as const
}

export function useArticleViewModel() {
  const queryClient = useQueryClient()

  const getAllArticles = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: ARTICLE_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => articleUseCase.getAllArticles(limit, offset, searchTerm)
    })
  }

  const getArticleById = (id: string) => {
    return useQuery({
      queryKey: ARTICLE_KEYS.detail(id),
      queryFn: () => articleUseCase.getArticleById(id),
      enabled: !!id
    })
  }

  const updateArticle = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ArticleEntity> }) =>
      articleUseCase.updateArticle(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ARTICLE_KEYS.all })
      queryClient.setQueryData(ARTICLE_KEYS.detail(updatedData.id), updatedData)
      toast.success('Artigo atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar artigo', {
        description: error.message
      })
    }
  })

  return {
    getAllArticles,
    getArticleById,
    updateArticle
  }
}
