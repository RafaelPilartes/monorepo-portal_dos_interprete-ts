import { SingleResponseType } from '@/type/IApiResponse'

export interface IStorageUploadResponse {
  path: string
  url: string
}

export interface IStorageRepository {
  uploadFile(
    file: File,
    bucket: string,
    path?: string
  ): Promise<SingleResponseType<IStorageUploadResponse>>

  deleteFile(bucket: string, path: string): Promise<void>

  getPublicUrl(bucket: string, path: string): string
}
