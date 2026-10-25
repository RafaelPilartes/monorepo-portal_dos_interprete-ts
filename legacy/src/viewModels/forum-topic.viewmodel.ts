import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { forumTopicUseCase } from '@/domain/usecases/ForumTopicUseCase'
import { ForumTopicEntity } from '@/core/entities/content/ForumTopicEntity'
import { toast } from 'sonner'

export const FORUM_TOPIC_KEYS = {
  all: ['forumTopics'] as const,
  lists: () => [...FORUM_TOPIC_KEYS.all, 'list'] as const,
  list: (filters: string) => [...FORUM_TOPIC_KEYS.lists(), { filters }] as const,
  details: () => [...FORUM_TOPIC_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...FORUM_TOPIC_KEYS.details(), id] as const
}

export function useForumTopicViewModel() {
  const queryClient = useQueryClient()

  const getAllForumTopics = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: FORUM_TOPIC_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => forumTopicUseCase.getAllForumTopics(limit, offset, searchTerm)
    })
  }

  const getForumTopicById = (id: string) => {
    return useQuery({
      queryKey: FORUM_TOPIC_KEYS.detail(id),
      queryFn: () => forumTopicUseCase.getForumTopicById(id),
      enabled: !!id
    })
  }

  const updateForumTopic = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ForumTopicEntity> }) =>
      forumTopicUseCase.updateForumTopic(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: FORUM_TOPIC_KEYS.all })
      queryClient.setQueryData(FORUM_TOPIC_KEYS.detail(updatedData.id), updatedData)
      toast.success('Tópico atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar tópico', {
        description: error.message
      })
    }
  })

  return {
    getAllForumTopics,
    getForumTopicById,
    updateForumTopic
  }
}
