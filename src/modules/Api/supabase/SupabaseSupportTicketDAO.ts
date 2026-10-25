import { SupportTicketEntity } from '@/core/entities/system/SupportTicketEntity'
import { ISupportTicketRepository } from '@/core/interfaces/ISupportTicketRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseSupportTicketDAO
  extends BaseSupabaseDAO<SupportTicketEntity>
  implements ISupportTicketRepository
{
  constructor() {
    super('support_tickets', ['subject', 'description'], '*, user:users(*), assigned_user:users(*)')
  }

  protected mapToEntity(data: any): SupportTicketEntity {
    return new SupportTicketEntity({
      ...data,
      user: data.user ? data.user : undefined,
      assigned_user: data.assigned_user ? data.assigned_user : undefined,
      resolved_at: data.resolved_at ? new Date(data.resolved_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
