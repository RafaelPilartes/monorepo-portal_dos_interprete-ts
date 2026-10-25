import { NotificationEntity } from '../entities/system/NotificationEntity'
import { IBaseRepository } from './IBaseRepository'

export interface INotificationRepository extends IBaseRepository<NotificationEntity> {}
