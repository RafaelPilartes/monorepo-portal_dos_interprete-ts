import { BookingLogEntity } from '@/core/entities/booking/BookingLogEntity'
import { IBookingLogRepository } from '@/core/interfaces/IBookingLogRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseBookingLogDAO
  extends BaseSupabaseDAO<BookingLogEntity>
  implements IBookingLogRepository
{
  constructor() {
    super('booking_logs', [], '*, booking:bookings(*), changed_by_user:users(*)')
  }

  protected mapToEntity(data: any): BookingLogEntity {
    return new BookingLogEntity({
      ...data,
      booking: data.booking ? data.booking : undefined,
      changed_by_user: data.changed_by_user ? data.changed_by_user : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
