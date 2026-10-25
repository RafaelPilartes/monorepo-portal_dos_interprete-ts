import { ArticleEntity } from '../entities/content/ArticleEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IArticleRepository extends IBaseRepository<ArticleEntity> {}
