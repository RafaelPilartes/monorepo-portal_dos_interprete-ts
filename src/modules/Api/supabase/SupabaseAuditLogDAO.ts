import { AuditLogEntity } from '@/core/entities/system/AuditLogEntity'
import { IAuditLogRepository } from '@/core/interfaces/IAuditLogRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseAuditLogDAO
  extends BaseSupabaseDAO<AuditLogEntity>
  implements IAuditLogRepository
{
  constructor() {
    super('audit_logs', ['action', 'module', 'description'], '*, user:users(*)')
  }

  protected mapToEntity(data: any): AuditLogEntity {
    return new AuditLogEntity({
      ...data,
      user: data.user ? data.user : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
