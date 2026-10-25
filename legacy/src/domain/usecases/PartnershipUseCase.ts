import { PartnershipEntity } from '@/core/entities/platform/PartnershipEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class PartnershipUseCase {
  async getPartnershipById(id: string): Promise<PartnershipEntity | null> {
    try {
      return await ApiRepository.partnership.getById(id)
    } catch (error) {
      console.error('Error fetching partnership:', error)
      throw error
    }
  }

  async getAllPartnerships(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<PartnershipEntity[]>> {
    try {
      return await ApiRepository.partnership.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching partnerships:', error)
      throw error
    }
  }

  async updatePartnership(
    id: string,
    data: Partial<PartnershipEntity>
  ): Promise<PartnershipEntity> {
    try {
      return await ApiRepository.partnership.update(id, data)
    } catch (error) {
      console.error('Error updating partnership:', error)
      throw error
    }
  }
}

export const partnershipUseCase = new PartnershipUseCase()
