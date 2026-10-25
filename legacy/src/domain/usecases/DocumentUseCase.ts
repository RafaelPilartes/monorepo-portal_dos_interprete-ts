import { DocumentEntity } from '@/core/entities/system/DocumentEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class DocumentUseCase {
  async getDocumentById(id: string): Promise<DocumentEntity | null> {
    try {
      return await ApiRepository.document.getById(id)
    } catch (error) {
      console.error('Error fetching document:', error)
      throw error
    }
  }

  async getAllDocuments(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<DocumentEntity[]>> {
    try {
      return await ApiRepository.document.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching documents:', error)
      throw error
    }
  }

  async updateDocument(
    id: string,
    data: Partial<DocumentEntity>
  ): Promise<DocumentEntity> {
    try {
      return await ApiRepository.document.update(id, data)
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  }
}

export const documentUseCase = new DocumentUseCase()
