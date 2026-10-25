import { PayoutEntity } from '../entities/financial/PayoutEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IPayoutRepository extends IBaseRepository<PayoutEntity> {}
