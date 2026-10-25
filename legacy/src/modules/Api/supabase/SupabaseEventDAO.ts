import { EventEntity } from '@/core/entities/content/EventEntity'
import { IEventRepository } from '@/core/interfaces/IEventRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseEventDAO
  extends BaseSupabaseDAO<EventEntity>
  implements IEventRepository
{
  constructor() {
    super('events', ['title', 'description', 'location'], '*, organizer:users(*)')
  }

  protected mapToEntity(data: any): EventEntity {
    return new EventEntity({
      ...data,
      organizer: data.organizer ? data.organizer : undefined,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
