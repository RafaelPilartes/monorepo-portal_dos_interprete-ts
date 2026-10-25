import { PaymentEntity } from '../entities/financial/PaymentEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IPaymentRepository extends IBaseRepository<PaymentEntity> {}
