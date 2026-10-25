import { AdminProfileEntity } from '@/core/entities/identity/AdminProfileEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class AdminProfileUseCase {
  private repository = ApiRepository.adminProfiles

  async executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<AdminProfileEntity>
  ): Promise<ListResponseType<AdminProfileEntity[]>> {
    return this.repository.getAll(limit, offset, searchTerm, filters)
  }

  async executeGetById(id: string): Promise<AdminProfileEntity | null> {
    return this.repository.getById(id)
  }

  async executeGetAllByField(
    field: keyof AdminProfileEntity,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<AdminProfileEntity[]>> {
    return this.repository.getAllByField(field, value, limit, offset)
  }

  async executeGetOneByField(
    field: keyof AdminProfileEntity,
    value: any
  ): Promise<AdminProfileEntity | null> {
    return this.repository.getOneByField(field as string, value)
  }

  async executeCreate(
    data: Omit<AdminProfileEntity, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AdminProfileEntity> {
    return this.repository.create(data)
  }

  async executeUpdate(
    id: string,
    data: Partial<AdminProfileEntity>
  ): Promise<AdminProfileEntity> {
    return this.repository.update(id, data)
  }

  async executeDelete(id: string): Promise<void> {
    return this.repository.delete(id)
  }

  // Real-time listeners
  listenToPosts(
    onUpdate: (posts: AdminProfileEntity[]) => void,
    filters?: Partial<AdminProfileEntity>
  ) {
    return this.repository.listenAll(onUpdate, undefined, { filters })
  }

  listenToPost(id: string, onUpdate: (post: AdminProfileEntity) => void) {
    return this.repository.listenById(id, onUpdate)
  }
}

export const adminProfileUseCase = new AdminProfileUseCase()
