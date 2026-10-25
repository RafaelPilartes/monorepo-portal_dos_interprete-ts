import { AuditLogEntity } from '@/core/entities/system/AuditLogEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class AuditLogUseCase {
  async getAuditLogById(id: string): Promise<AuditLogEntity | null> {
    try {
      return await ApiRepository.auditLog.getById(id)
    } catch (error) {
      console.error('Error fetching auditLog:', error)
      throw error
    }
  }

  async getAllAuditLogs(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<AuditLogEntity[]>> {
    try {
      return await ApiRepository.auditLog.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching auditLogs:', error)
      throw error
    }
  }

  async updateAuditLog(
    id: string,
    data: Partial<AuditLogEntity>
  ): Promise<AuditLogEntity> {
    try {
      return await ApiRepository.auditLog.update(id, data)
    } catch (error) {
      console.error('Error updating auditLog:', error)
      throw error
    }
  }
}

export const auditLogUseCase = new AuditLogUseCase()
