import { SuccessCaseEntity } from '@/core/entities/content/SuccessCaseEntity'
import { ISuccessCaseRepository } from '@/core/interfaces/ISuccessCaseRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseSuccessCaseDAO
  extends BaseSupabaseDAO<SuccessCaseEntity>
  implements ISuccessCaseRepository
{
  constructor() {
    super(
      'success_cases',
      ['title', 'summary', 'content'],
      '*, interpreter:interpreter_profiles(*, user:users(*)), requester:requester_profiles(*, user:users(*)), booking:bookings(*), author_user:users(*)'
    )
  }

  protected mapToEntity(data: any): SuccessCaseEntity {
    return new SuccessCaseEntity({
      ...data,
      interpreter: data.interpreter ? data.interpreter : undefined,
      requester: data.requester ? data.requester : undefined,
      booking: data.booking ? data.booking : undefined,
      author_user: data.author_user ? data.author_user : undefined,
      published_at: data.published_at ? new Date(data.published_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
