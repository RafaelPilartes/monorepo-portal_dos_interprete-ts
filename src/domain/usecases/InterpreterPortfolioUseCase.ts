import { InterpreterPortfolioEntity } from '@/core/entities/interpreter/InterpreterPortfolioEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class InterpreterPortfolioUseCase {
  async getPortfolioById(id: string): Promise<InterpreterPortfolioEntity | null> {
    try {
      return await ApiRepository.interpreterPortfolio.getById(id)
    } catch (error) {
      console.error('Error fetching interpreter portfolio:', error)
      throw error
    }
  }

  async getAllPortfolios(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<InterpreterPortfolioEntity[]>> {
    try {
      return await ApiRepository.interpreterPortfolio.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching interpreter portfolios:', error)
      throw error
    }
  }

  async getPortfoliosByInterpreterId(
    interpreterProfileId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<InterpreterPortfolioEntity[]>> {
    try {
      return await ApiRepository.interpreterPortfolio.getAllByField(
        'interpreter_profile_id',
        interpreterProfileId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching interpreter portfolios by interpreter ID:', error)
      throw error
    }
  }

  async updatePortfolio(
    id: string,
    data: Partial<InterpreterPortfolioEntity>
  ): Promise<InterpreterPortfolioEntity> {
    try {
      return await ApiRepository.interpreterPortfolio.update(id, data)
    } catch (error) {
      console.error('Error updating interpreter portfolio:', error)
      throw error
    }
  }
}

export const interpreterPortfolioUseCase = new InterpreterPortfolioUseCase()
