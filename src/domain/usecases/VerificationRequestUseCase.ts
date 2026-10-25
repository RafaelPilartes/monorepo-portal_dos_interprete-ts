import { VerificationRequestEntity } from '@/core/entities/system/VerificationRequestEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class VerificationRequestUseCase {
  async getVerificationRequestById(id: string): Promise<VerificationRequestEntity | null> {
    try {
      return await ApiRepository.verificationRequest.getById(id)
    } catch (error) {
      console.error('Error fetching verificationRequest:', error)
      throw error
    }
  }

  async getAllVerificationRequests(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<VerificationRequestEntity[]>> {
    try {
      return await ApiRepository.verificationRequest.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching verificationRequests:', error)
      throw error
    }
  }

  async updateVerificationRequest(
    id: string,
    data: Partial<VerificationRequestEntity>
  ): Promise<VerificationRequestEntity> {
    try {
      return await ApiRepository.verificationRequest.update(id, data)
    } catch (error) {
      console.error('Error updating verificationRequest:', error)
      throw error
    }
  }
}

export const verificationRequestUseCase = new VerificationRequestUseCase()
