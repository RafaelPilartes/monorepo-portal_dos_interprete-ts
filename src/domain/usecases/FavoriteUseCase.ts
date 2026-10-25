import { FavoriteEntity } from '@/core/entities/booking/FavoriteEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class FavoriteUseCase {
  async getFavoriteById(id: string): Promise<FavoriteEntity | null> {
    try {
      return await ApiRepository.favorite.getById(id)
    } catch (error) {
      console.error('Error fetching favorite:', error)
      throw error
    }
  }

  async getFavoritesByRequesterId(
    requesterId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<FavoriteEntity[]>> {
    try {
      return await ApiRepository.favorite.getAllByField(
        'requester_profile_id',
        requesterId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching favorites by requester ID:', error)
      throw error
    }
  }
}

export const favoriteUseCase = new FavoriteUseCase()
