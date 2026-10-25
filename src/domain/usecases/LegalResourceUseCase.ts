import { LegalResourceEntity } from '@/core/entities/system/LegalResourceEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class LegalResourceUseCase {
  async getLegalResourceById(id: string): Promise<LegalResourceEntity | null> {
    try {
      return await ApiRepository.legalResource.getById(id)
    } catch (error) {
      console.error('Error fetching legalResource:', error)
      throw error
    }
  }

  async getAllLegalResources(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<LegalResourceEntity[]>> {
    try {
      return await ApiRepository.legalResource.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching legalResources:', error)
      throw error
    }
  }

  async updateLegalResource(
    id: string,
    data: Partial<LegalResourceEntity>
  ): Promise<LegalResourceEntity> {
    try {
      return await ApiRepository.legalResource.update(id, data)
    } catch (error) {
      console.error('Error updating legalResource:', error)
      throw error
    }
  }
}

export const legalResourceUseCase = new LegalResourceUseCase()
