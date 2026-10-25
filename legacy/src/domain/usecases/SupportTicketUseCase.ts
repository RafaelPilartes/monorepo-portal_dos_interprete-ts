import { SupportTicketEntity } from '@/core/entities/system/SupportTicketEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class SupportTicketUseCase {
  async getSupportTicketById(id: string): Promise<SupportTicketEntity | null> {
    try {
      return await ApiRepository.supportTicket.getById(id)
    } catch (error) {
      console.error('Error fetching supportTicket:', error)
      throw error
    }
  }

  async getAllSupportTickets(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<SupportTicketEntity[]>> {
    try {
      return await ApiRepository.supportTicket.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching supportTickets:', error)
      throw error
    }
  }

  async updateSupportTicket(
    id: string,
    data: Partial<SupportTicketEntity>
  ): Promise<SupportTicketEntity> {
    try {
      return await ApiRepository.supportTicket.update(id, data)
    } catch (error) {
      console.error('Error updating supportTicket:', error)
      throw error
    }
  }
}

export const supportTicketUseCase = new SupportTicketUseCase()
