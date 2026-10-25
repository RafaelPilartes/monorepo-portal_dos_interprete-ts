import { InterpreterServiceEntity } from '@/core/entities/interpreter/InterpreterServiceEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class InterpreterServiceUseCase {
  async getServiceById(id: string): Promise<InterpreterServiceEntity | null> {
    try {
      return await ApiRepository.interpreterService.getById(id)
    } catch (error) {
      console.error('Error fetching interpreter service:', error)
      throw error
    }
  }

  async getAllServices(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<InterpreterServiceEntity[]>> {
    try {
      return await ApiRepository.interpreterService.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching interpreter services:', error)
      throw error
    }
  }

  async getServicesByInterpreterId(
    interpreterProfileId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<InterpreterServiceEntity[]>> {
    try {
      return await ApiRepository.interpreterService.getAllByField(
        'interpreter_profile_id',
        interpreterProfileId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching interpreter services by interpreter ID:', error)
      throw error
    }
  }

  async updateService(
    id: string,
    data: Partial<InterpreterServiceEntity>
  ): Promise<InterpreterServiceEntity> {
    try {
      return await ApiRepository.interpreterService.update(id, data)
    } catch (error) {
      console.error('Error updating interpreter service:', error)
      throw error
    }
  }
}

export const interpreterServiceUseCase = new InterpreterServiceUseCase()
