import { supabase } from '@/config/supabase'
import {
  IStorageRepository,
  IStorageUploadResponse
} from '@/core/interfaces/IStorageRepository'
import { SingleResponseType } from '@/type/IApiResponse'

export class SupabaseStorageDAO implements IStorageRepository {
  async uploadFile(
    file: File,
    bucket: string,
    path?: string
  ): Promise<SingleResponseType<IStorageUploadResponse>> {
    // Generate a unique filename if path is not provided or ends with a slash
    let filePath = path || ''
    if (!filePath || filePath.endsWith('/')) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      filePath = `${filePath}${fileName}`
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (error) {
      throw new Error(error.message)
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      data: {
        path: data.path,
        url: publicUrl
      }
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      throw new Error(error.message)
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    const {
      data: { publicUrl }
    } = supabase.storage.from(bucket).getPublicUrl(path)

    return publicUrl
  }
}
