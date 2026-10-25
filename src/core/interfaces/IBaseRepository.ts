import { ListResponseType } from '@/type/IApiResponse'

export interface IBaseRepository<T> {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<T>
  ): Promise<ListResponseType<T[]>>

  getById(id: string): Promise<T | null>

  getAllByField(
    field: keyof T,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<T[]>>

  getOneByField(field: string, value: any): Promise<T | null>

  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>

  update(id: string, data: Partial<T>): Promise<T>

  delete(id: string): Promise<void>

  listenById(
    id: string,
    onUpdate: (data: T) => void,
    onError?: (err: Error) => void
  ): () => void

  listenByField(
    field: keyof T,
    value: string,
    onUpdate: (data: T) => void,
    onError?: (err: Error) => void
  ): () => void

  listenAllByField(
    field: keyof T,
    value: any,
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options?: {
      limit?: number
      orderBy?: keyof T
      orderDirection?: 'asc' | 'desc'
    }
  ): () => void

  listenAll(
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options?: {
      filters?: Partial<T>
      limit?: number
      orderBy?: keyof T
      orderDirection?: 'asc' | 'desc'
    }
  ): () => void
}
