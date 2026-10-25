import { EventEntity } from '../entities/content/EventEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IEventRepository extends IBaseRepository<EventEntity> {}
