import { AuditLogEntity } from '../entities/system/AuditLogEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IAuditLogRepository extends IBaseRepository<AuditLogEntity> {}
