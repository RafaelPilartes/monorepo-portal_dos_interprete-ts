import { ReviewEntity } from '@/core/entities/booking/ReviewEntity'
import { IReviewRepository } from '@/core/interfaces/IReviewRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseReviewDAO
  extends BaseSupabaseDAO<ReviewEntity>
  implements IReviewRepository
{
  constructor() {
    // Join multiple profiles cleanly
    super(
      'reviews',
      ['comment'],
      '*, booking:bookings(*), author_interpreter:interpreter_profiles(*, user:users(*)), author_requester:requester_profiles(*, user:users(*)), target_interpreter:interpreter_profiles(*, user:users(*)), target_requester:requester_profiles(*, user:users(*))'
    )
  }

  protected mapToEntity(data: any): ReviewEntity {
    return new ReviewEntity({
      ...data,
      booking: data.booking ? data.booking : undefined,
      author_interpreter: data.author_interpreter ? data.author_interpreter : undefined,
      author_requester: data.author_requester ? data.author_requester : undefined,
      target_interpreter: data.target_interpreter ? data.target_interpreter : undefined,
      target_requester: data.target_requester ? data.target_requester : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
