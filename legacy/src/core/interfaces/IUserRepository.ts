import { UserEntity } from '../entities/identity/UserEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IUserRepository extends IBaseRepository<UserEntity> {}
