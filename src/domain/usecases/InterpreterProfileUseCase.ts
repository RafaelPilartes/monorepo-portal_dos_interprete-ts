import { InterpreterProfileEntity } from '@/core/entities/identity/InterpreterProfileEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class InterpreterProfileUseCase {
  async getProfileById(id: string): Promise<InterpreterProfileEntity | null> {
    try {
      return await ApiRepository.interpreterProfile.getById(id)
    } catch (error) {
      console.error('Error fetching interpreter profile:', error)
      throw error
    }
  }

  async getAllProfiles(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<InterpreterProfileEntity[]>> {
    try {
      return await ApiRepository.interpreterProfile.getAll(
        limit,
        offset,
        searchTerm
      )
    } catch (error) {
      console.error('Error fetching interpreter profiles:', error)
      throw error
    }
  }

  async updateProfile(
    id: string,
    data: Partial<InterpreterProfileEntity>
  ): Promise<InterpreterProfileEntity> {
    try {
      return await ApiRepository.interpreterProfile.update(id, data)
    } catch (error) {
      console.error('Error updating interpreter profile:', error)
      throw error
    }
  }
}

export const interpreterProfileUseCase = new InterpreterProfileUseCase()
