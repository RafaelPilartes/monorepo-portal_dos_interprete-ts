import { FavoriteEntity } from '@/core/entities/booking/FavoriteEntity'
import { IFavoriteRepository } from '@/core/interfaces/IFavoriteRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseFavoriteDAO
  extends BaseSupabaseDAO<FavoriteEntity>
  implements IFavoriteRepository
{
  constructor() {
    super(
      'favorites',
      [],
      '*, requester_profile:requester_profiles(*, user:users(*)), interpreter_profile:interpreter_profiles(*, user:users(*))'
    )
  }

  protected mapToEntity(data: any): FavoriteEntity {
    return new FavoriteEntity({
      ...data,
      requester_profile: data.requester_profile
        ? data.requester_profile
        : undefined,
      interpreter_profile: data.interpreter_profile
        ? data.interpreter_profile
        : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
