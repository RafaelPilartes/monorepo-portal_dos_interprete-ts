import { InterpreterExperienceEntity } from '@/core/entities/interpreter/InterpreterExperienceEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class InterpreterExperienceUseCase {
  async getExperienceById(id: string): Promise<InterpreterExperienceEntity | null> {
    try {
      return await ApiRepository.interpreterExperience.getById(id)
    } catch (error) {
      console.error('Error fetching interpreter experience:', error)
      throw error
    }
  }

  async getAllExperiences(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<InterpreterExperienceEntity[]>> {
    try {
      return await ApiRepository.interpreterExperience.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching interpreter experiences:', error)
      throw error
    }
  }

  async updateExperience(
    id: string,
    data: Partial<InterpreterExperienceEntity>
  ): Promise<InterpreterExperienceEntity> {
    try {
      return await ApiRepository.interpreterExperience.update(id, data)
    } catch (error) {
      console.error('Error updating interpreter experience:', error)
      throw error
    }
  }
}

export const interpreterExperienceUseCase = new InterpreterExperienceUseCase()
