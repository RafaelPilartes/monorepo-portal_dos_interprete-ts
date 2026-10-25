import { InterpreterEducationEntity } from '@/core/entities/interpreter/InterpreterEducationEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class InterpreterEducationUseCase {
  async getEducationById(id: string): Promise<InterpreterEducationEntity | null> {
    try {
      return await ApiRepository.interpreterEducation.getById(id)
    } catch (error) {
      console.error('Error fetching interpreter education:', error)
      throw error
    }
  }

  async getAllEducations(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<InterpreterEducationEntity[]>> {
    try {
      return await ApiRepository.interpreterEducation.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching interpreter educations:', error)
      throw error
    }
  }

  async getEducationsByInterpreterId(
    interpreterProfileId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<InterpreterEducationEntity[]>> {
    try {
      return await ApiRepository.interpreterEducation.getAllByField(
        'interpreter_profile_id',
        interpreterProfileId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching interpreter educations by interpreter ID:', error)
      throw error
    }
  }

  async updateEducation(
    id: string,
    data: Partial<InterpreterEducationEntity>
  ): Promise<InterpreterEducationEntity> {
    try {
      return await ApiRepository.interpreterEducation.update(id, data)
    } catch (error) {
      console.error('Error updating interpreter education:', error)
      throw error
    }
  }
}

export const interpreterEducationUseCase = new InterpreterEducationUseCase()
