import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { forumPostUseCase } from '@/domain/usecases/ForumPostUseCase'
import { ForumPostEntity } from '@/core/entities/content/ForumPostEntity'
import { toast } from 'sonner'

export const FORUM_POST_KEYS = {
  all: ['forumPosts'] as const,
  lists: () => [...FORUM_POST_KEYS.all, 'list'] as const,
  list: (filters: string) => [...FORUM_POST_KEYS.lists(), { filters }] as const,
  details: () => [...FORUM_POST_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...FORUM_POST_KEYS.details(), id] as const
}

export function useForumPostViewModel() {
  const queryClient = useQueryClient()

  const getAllForumPosts = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: FORUM_POST_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => forumPostUseCase.getAllForumPosts(limit, offset, searchTerm)
    })
  }

  const getForumPostById = (id: string) => {
    return useQuery({
      queryKey: FORUM_POST_KEYS.detail(id),
      queryFn: () => forumPostUseCase.getForumPostById(id),
      enabled: !!id
    })
  }

  const updateForumPost = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ForumPostEntity> }) =>
      forumPostUseCase.updateForumPost(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: FORUM_POST_KEYS.all })
      queryClient.setQueryData(FORUM_POST_KEYS.detail(updatedData.id), updatedData)
      toast.success('Post atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar post', {
        description: error.message
      })
    }
  })

  return {
    getAllForumPosts,
    getForumPostById,
    updateForumPost
  }
}
