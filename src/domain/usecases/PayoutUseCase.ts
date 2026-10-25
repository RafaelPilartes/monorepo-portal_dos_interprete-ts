import { PayoutEntity } from '@/core/entities/financial/PayoutEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class PayoutUseCase {
  async getPayoutById(id: string): Promise<PayoutEntity | null> {
    try {
      return await ApiRepository.payout.getById(id)
    } catch (error) {
      console.error('Error fetching payout:', error)
      throw error
    }
  }

  async getAllPayouts(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<PayoutEntity[]>> {
    try {
      return await ApiRepository.payout.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching payouts:', error)
      throw error
    }
  }

  async updatePayout(
    id: string,
    data: Partial<PayoutEntity>
  ): Promise<PayoutEntity> {
    try {
      return await ApiRepository.payout.update(id, data)
    } catch (error) {
      console.error('Error updating payout:', error)
      throw error
    }
  }
}

export const payoutUseCase = new PayoutUseCase()
