import { OpportunityEntity } from '@/core/entities/platform/OpportunityEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class OpportunityUseCase {
  async getOpportunityById(id: string): Promise<OpportunityEntity | null> {
    try {
      return await ApiRepository.opportunity.getById(id)
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      throw error
    }
  }

  async getAllOpportunities(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<OpportunityEntity[]>> {
    try {
      return await ApiRepository.opportunity.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      throw error
    }
  }

  async updateOpportunity(
    id: string,
    data: Partial<OpportunityEntity>
  ): Promise<OpportunityEntity> {
    try {
      return await ApiRepository.opportunity.update(id, data)
    } catch (error) {
      console.error('Error updating opportunity:', error)
      throw error
    }
  }
}

export const opportunityUseCase = new OpportunityUseCase()
