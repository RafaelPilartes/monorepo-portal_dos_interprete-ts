import { ServiceEntity } from '../entities/booking/ServiceEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IServiceRepository extends IBaseRepository<ServiceEntity> {}
