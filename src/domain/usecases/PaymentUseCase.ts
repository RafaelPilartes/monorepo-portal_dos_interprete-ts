import { PaymentEntity } from '@/core/entities/financial/PaymentEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class PaymentUseCase {
  async getPaymentById(id: string): Promise<PaymentEntity | null> {
    try {
      return await ApiRepository.payment.getById(id)
    } catch (error) {
      console.error('Error fetching payment:', error)
      throw error
    }
  }

  async getAllPayments(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<PaymentEntity[]>> {
    try {
      return await ApiRepository.payment.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching payments:', error)
      throw error
    }
  }

  async updatePayment(
    id: string,
    data: Partial<PaymentEntity>
  ): Promise<PaymentEntity> {
    try {
      return await ApiRepository.payment.update(id, data)
    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }
}

export const paymentUseCase = new PaymentUseCase()
