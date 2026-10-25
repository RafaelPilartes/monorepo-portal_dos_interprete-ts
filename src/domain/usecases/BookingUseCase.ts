import { BookingEntity } from '@/core/entities/booking/BookingEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class BookingUseCase {
  async getBookingById(id: string): Promise<BookingEntity | null> {
    try {
      return await ApiRepository.booking.getById(id)
    } catch (error) {
      console.error('Error fetching booking:', error)
      throw error
    }
  }

  async getAllBookings(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<BookingEntity[]>> {
    try {
      return await ApiRepository.booking.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      throw error
    }
  }

  async getBookingsByInterpreterId(
    interpreterId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<BookingEntity[]>> {
    try {
      return await ApiRepository.booking.getAllByField(
        'interpreter_profile_id',
        interpreterId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching bookings by interpreter:', error)
      throw error
    }
  }

  async getBookingsByRequesterId(
    requesterId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<BookingEntity[]>> {
    try {
      return await ApiRepository.booking.getAllByField(
        'requester_profile_id',
        requesterId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching bookings by requester:', error)
      throw error
    }
  }

  async updateBooking(
    id: string,
    data: Partial<BookingEntity>
  ): Promise<BookingEntity> {
    try {
      return await ApiRepository.booking.update(id, data)
    } catch (error) {
      console.error('Error updating booking:', error)
      throw error
    }
  }
}

export const bookingUseCase = new BookingUseCase()
