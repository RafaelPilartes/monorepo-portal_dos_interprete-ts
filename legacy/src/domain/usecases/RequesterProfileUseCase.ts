import { RequesterProfileEntity } from '@/core/entities/identity/RequesterProfileEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class RequesterProfileUseCase {
  async getProfileById(id: string): Promise<RequesterProfileEntity | null> {
    try {
      return await ApiRepository.requesterProfile.getById(id)
    } catch (error) {
      console.error('Error fetching requester profile:', error)
      throw error
    }
  }

  async getAllProfiles(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<RequesterProfileEntity[]>> {
    try {
      return await ApiRepository.requesterProfile.getAll(
        limit,
        offset,
        searchTerm
      )
    } catch (error) {
      console.error('Error fetching requester profiles:', error)
      throw error
    }
  }

  async updateProfile(
    id: string,
    data: Partial<RequesterProfileEntity>
  ): Promise<RequesterProfileEntity> {
    try {
      return await ApiRepository.requesterProfile.update(id, data)
    } catch (error) {
      console.error('Error updating requester profile:', error)
      throw error
    }
  }
}

export const requesterProfileUseCase = new RequesterProfileUseCase()
