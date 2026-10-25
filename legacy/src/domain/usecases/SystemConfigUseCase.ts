import { SystemConfigEntity } from '@/core/entities/system/SystemConfigEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class SystemConfigUseCase {
  async getSystemConfigById(id: string): Promise<SystemConfigEntity | null> {
    try {
      return await ApiRepository.systemConfig.getById(id)
    } catch (error) {
      console.error('Error fetching systemConfig:', error)
      throw error
    }
  }

  async getAllSystemConfigs(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<SystemConfigEntity[]>> {
    try {
      return await ApiRepository.systemConfig.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching systemConfigs:', error)
      throw error
    }
  }

  async updateSystemConfig(
    id: string,
    data: Partial<SystemConfigEntity>
  ): Promise<SystemConfigEntity> {
    try {
      return await ApiRepository.systemConfig.update(id, data)
    } catch (error) {
      console.error('Error updating systemConfig:', error)
      throw error
    }
  }
}

export const systemConfigUseCase = new SystemConfigUseCase()
