import { ServiceEntity } from '@/core/entities/booking/ServiceEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class ServiceUseCase {
  async getServiceById(id: string): Promise<ServiceEntity | null> {
    try {
      return await ApiRepository.service.getById(id)
    } catch (error) {
      console.error('Error fetching service:', error)
      throw error
    }
  }

  async getAllServices(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<ServiceEntity[]>> {
    try {
      return await ApiRepository.service.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching services:', error)
      throw error
    }
  }

  async updateService(
    id: string,
    data: Partial<ServiceEntity>
  ): Promise<ServiceEntity> {
    try {
      return await ApiRepository.service.update(id, data)
    } catch (error) {
      console.error('Error updating service:', error)
      throw error
    }
  }
}

export const serviceUseCase = new ServiceUseCase()
