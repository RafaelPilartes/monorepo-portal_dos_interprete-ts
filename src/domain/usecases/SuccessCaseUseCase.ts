import { SuccessCaseEntity } from '@/core/entities/content/SuccessCaseEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class SuccessCaseUseCase {
  async getSuccessCaseById(id: string): Promise<SuccessCaseEntity | null> {
    try {
      return await ApiRepository.successCase.getById(id)
    } catch (error) {
      console.error('Error fetching successCase:', error)
      throw error
    }
  }

  async getAllSuccessCases(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<SuccessCaseEntity[]>> {
    try {
      return await ApiRepository.successCase.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching successCases:', error)
      throw error
    }
  }

  async updateSuccessCase(
    id: string,
    data: Partial<SuccessCaseEntity>
  ): Promise<SuccessCaseEntity> {
    try {
      return await ApiRepository.successCase.update(id, data)
    } catch (error) {
      console.error('Error updating successCase:', error)
      throw error
    }
  }
}

export const successCaseUseCase = new SuccessCaseUseCase()
