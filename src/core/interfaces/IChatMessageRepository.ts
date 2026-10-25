import { ChatMessageEntity } from '../entities/booking/ChatMessageEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IChatMessageRepository extends IBaseRepository<ChatMessageEntity> {}
