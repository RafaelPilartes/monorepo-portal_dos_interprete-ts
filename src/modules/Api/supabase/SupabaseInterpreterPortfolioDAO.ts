import { InterpreterPortfolioEntity } from '@/core/entities/interpreter/InterpreterPortfolioEntity'
import { IInterpreterPortfolioRepository } from '@/core/interfaces/IInterpreterPortfolioRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseInterpreterPortfolioDAO
  extends BaseSupabaseDAO<InterpreterPortfolioEntity>
  implements IInterpreterPortfolioRepository
{
  constructor() {
    super('interpreter_portfolios', ['title'])
  }

  protected mapToEntity(data: any): InterpreterPortfolioEntity {
    return new InterpreterPortfolioEntity({
      ...data,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
