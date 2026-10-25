import { useQuery } from '@tanstack/react-query'
import { favoriteUseCase } from '@/domain/usecases/FavoriteUseCase'

export const FAVORITE_KEYS = {
  all: ['favorites'] as const,
  lists: () => [...FAVORITE_KEYS.all, 'list'] as const,
  byRequester: (requesterId: string) => [...FAVORITE_KEYS.lists(), 'requester', requesterId] as const,
  details: () => [...FAVORITE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...FAVORITE_KEYS.details(), id] as const
}

export function useFavoriteViewModel() {
  const getFavoritesByRequesterId = (requesterId: string, limit?: number, offset?: number) => {
    return useQuery({
      queryKey: FAVORITE_KEYS.byRequester(requesterId),
      queryFn: () => favoriteUseCase.getFavoritesByRequesterId(requesterId, limit, offset),
      enabled: !!requesterId
    })
  }

  return {
    getFavoritesByRequesterId
  }
}
