import { SupportTicketEntity } from '../entities/system/SupportTicketEntity'
import { IBaseRepository } from './IBaseRepository'

export interface ISupportTicketRepository extends IBaseRepository<SupportTicketEntity> {}
