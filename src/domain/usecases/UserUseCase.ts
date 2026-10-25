import { UserEntity } from '@/core/entities/identity/UserEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class UserUseCase {
  private repository = ApiRepository.user

  async executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<UserEntity>
  ): Promise<ListResponseType<UserEntity[]>> {
    return this.repository.getAll(limit, offset, searchTerm, filters)
  }

  async executeGetById(id: string): Promise<UserEntity | null> {
    return this.repository.getById(id)
  }

  async executeCreate(
    data: Omit<UserEntity, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserEntity> {
    return this.repository.create(data)
  }

  async executeUpdate(
    id: string,
    data: Partial<UserEntity>
  ): Promise<UserEntity> {
    return this.repository.update(id, data)
  }

  async executeDelete(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}

export const userUseCase = new UserUseCase()
