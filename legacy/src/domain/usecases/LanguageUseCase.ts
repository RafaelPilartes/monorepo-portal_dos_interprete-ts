import { LanguageEntity } from '@/core/entities/platform/LanguageEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class LanguageUseCase {
  async getLanguageById(id: string): Promise<LanguageEntity | null> {
    try {
      return await ApiRepository.language.getById(id)
    } catch (error) {
      console.error('Error fetching language:', error)
      throw error
    }
  }

  async getAllLanguages(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<LanguageEntity[]>> {
    try {
      return await ApiRepository.language.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching languages:', error)
      throw error
    }
  }

  async updateLanguage(
    id: string,
    data: Partial<LanguageEntity>
  ): Promise<LanguageEntity> {
    try {
      return await ApiRepository.language.update(id, data)
    } catch (error) {
      console.error('Error updating language:', error)
      throw error
    }
  }
}

export const languageUseCase = new LanguageUseCase()
