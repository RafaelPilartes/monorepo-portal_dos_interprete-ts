import { SpecialtyEntity } from '@/core/entities/platform/SpecialtyEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class SpecialtyUseCase {
  async getSpecialtyById(id: string): Promise<SpecialtyEntity | null> {
    try {
      return await ApiRepository.specialty.getById(id)
    } catch (error) {
      console.error('Error fetching specialty:', error)
      throw error
    }
  }

  async getAllSpecialties(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<SpecialtyEntity[]>> {
    try {
      return await ApiRepository.specialty.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching specialties:', error)
      throw error
    }
  }

  async updateSpecialty(
    id: string,
    data: Partial<SpecialtyEntity>
  ): Promise<SpecialtyEntity> {
    try {
      return await ApiRepository.specialty.update(id, data)
    } catch (error) {
      console.error('Error updating specialty:', error)
      throw error
    }
  }
}

export const specialtyUseCase = new SpecialtyUseCase()
