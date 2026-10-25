import { FavoriteEntity } from '../entities/booking/FavoriteEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IFavoriteRepository extends IBaseRepository<FavoriteEntity> {}
