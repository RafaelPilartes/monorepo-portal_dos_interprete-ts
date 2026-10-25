import { InterpreterCertificationEntity } from '@/core/entities/interpreter/InterpreterCertificationEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class InterpreterCertificationUseCase {
  async getCertificationById(id: string): Promise<InterpreterCertificationEntity | null> {
    try {
      return await ApiRepository.interpreterCertification.getById(id)
    } catch (error) {
      console.error('Error fetching interpreter certification:', error)
      throw error
    }
  }

  async getAllCertifications(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<InterpreterCertificationEntity[]>> {
    try {
      return await ApiRepository.interpreterCertification.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching interpreter certifications:', error)
      throw error
    }
  }

  async getCertificationsByInterpreterId(
    interpreterProfileId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<InterpreterCertificationEntity[]>> {
    try {
      return await ApiRepository.interpreterCertification.getAllByField(
        'interpreter_profile_id',
        interpreterProfileId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching interpreter certifications by interpreter ID:', error)
      throw error
    }
  }

  async updateCertification(
    id: string,
    data: Partial<InterpreterCertificationEntity>
  ): Promise<InterpreterCertificationEntity> {
    try {
      return await ApiRepository.interpreterCertification.update(id, data)
    } catch (error) {
      console.error('Error updating interpreter certification:', error)
      throw error
    }
  }
}

export const interpreterCertificationUseCase = new InterpreterCertificationUseCase()
