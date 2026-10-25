import { BookingEntity } from '../entities/booking/BookingEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IBookingRepository extends IBaseRepository<BookingEntity> {}
