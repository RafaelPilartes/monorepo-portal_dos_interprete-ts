import { DocumentEntity } from '../entities/system/DocumentEntity'
import { IBaseRepository } from './IBaseRepository'

export interface IDocumentRepository extends IBaseRepository<DocumentEntity> {}
