import { BookingLogEntity } from '../entities/booking/BookingLogEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IBookingLogRepository extends IBaseRepository<BookingLogEntity> {}
