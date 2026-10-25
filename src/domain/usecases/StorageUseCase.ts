import { ApiRepository } from '@/modules/Api'
import { IStorageUploadResponse } from '@/core/interfaces/IStorageRepository'
import { SingleResponseType } from '@/type/IApiResponse'

export class StorageUseCase {
  private repository = ApiRepository.storage

  async executeUpload(
    file: File,
    bucket: string,
    path?: string
  ): Promise<SingleResponseType<IStorageUploadResponse>> {
    return this.repository.uploadFile(file, bucket, path)
  }

  async executeDelete(bucket: string, path: string): Promise<void> {
    return this.repository.deleteFile(bucket, path)
  }
}

export const storageUseCase = new StorageUseCase()
