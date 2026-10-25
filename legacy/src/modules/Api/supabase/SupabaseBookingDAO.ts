import { BookingEntity } from '@/core/entities/booking/BookingEntity'
import { IBookingRepository } from '@/core/interfaces/IBookingRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseBookingDAO
  extends BaseSupabaseDAO<BookingEntity>
  implements IBookingRepository
{
  constructor() {
    super(
      'bookings',
      ['location_type', 'status'],
      '*, service:services(*), requester_profile:requester_profiles(*, user:users(*)), interpreter_profile:interpreter_profiles(*, user:users(*))'
    )
  }

  protected mapToEntity(data: any): BookingEntity {
    return new BookingEntity({
      ...data,
      service: data.service ? data.service : undefined,
      requester_profile: data.requester_profile
        ? data.requester_profile
        : undefined,
      interpreter_profile: data.interpreter_profile
        ? data.interpreter_profile
        : undefined,
      scheduled_date: new Date(data.scheduled_date),
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
