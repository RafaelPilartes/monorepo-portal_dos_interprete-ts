import { InterpreterAvailabilityEntity } from '@/core/entities/interpreter/InterpreterAvailabilityEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class InterpreterAvailabilityUseCase {
  async getAvailabilityById(id: string): Promise<InterpreterAvailabilityEntity | null> {
    try {
      return await ApiRepository.interpreterAvailability.getById(id)
    } catch (error) {
      console.error('Error fetching interpreter availability:', error)
      throw error
    }
  }

  async getAllAvailabilities(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<InterpreterAvailabilityEntity[]>> {
    try {
      return await ApiRepository.interpreterAvailability.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching interpreter availabilities:', error)
      throw error
    }
  }

  async getAvailabilitiesByInterpreterId(
    interpreterId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<InterpreterAvailabilityEntity[]>> {
    try {
      return await ApiRepository.interpreterAvailability.getAllByField(
        'interpreter_id',
        interpreterId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching interpreter availabilities by interpreter ID:', error)
      throw error
    }
  }

  async updateAvailability(
    id: string,
    data: Partial<InterpreterAvailabilityEntity>
  ): Promise<InterpreterAvailabilityEntity> {
    try {
      return await ApiRepository.interpreterAvailability.update(id, data)
    } catch (error) {
      console.error('Error updating interpreter availability:', error)
      throw error
    }
  }
}

export const interpreterAvailabilityUseCase = new InterpreterAvailabilityUseCase()
