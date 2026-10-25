import { BookingLogEntity } from '@/core/entities/booking/BookingLogEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class BookingLogUseCase {
  async getBookingLogById(id: string): Promise<BookingLogEntity | null> {
    try {
      return await ApiRepository.bookingLog.getById(id)
    } catch (error) {
      console.error('Error fetching booking log:', error)
      throw error
    }
  }

  async getLogsByBookingId(
    bookingId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<BookingLogEntity[]>> {
    try {
      return await ApiRepository.bookingLog.getAllByField(
        'booking_id',
        bookingId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching booking logs by booking ID:', error)
      throw error
    }
  }
}

export const bookingLogUseCase = new BookingLogUseCase()
