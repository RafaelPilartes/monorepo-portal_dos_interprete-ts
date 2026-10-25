import { useState } from 'react'
import { storageUseCase } from '@/domain/usecases/StorageUseCase'
import { toast } from 'sonner' // Assuming sonner is used for toasts based on package.json

export function useStorageViewModel() {
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = async (
    file: File,
    bucket: string = 'images', // Default bucket
    path?: string
  ) => {
    try {
      setLoading(true)
      setUploadProgress(0)
      // Supabase client upload progress is not directly exposed in this architecture
      // since we are going through repo/usecase without callbacks.
      // For now, we simulate start/end or rely on future improvements for progress.

      const response = await storageUseCase.executeUpload(file, bucket, path)

      setUploadProgress(100)
      toast.success('Upload realizado com sucesso!')
      return response.data
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar upload')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (bucket: string, path: string) => {
    try {
      setLoading(true)
      await storageUseCase.executeDelete(bucket, path)
      toast.success('Arquivo removido com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover arquivo')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    uploadProgress,
    uploadFile,
    deleteFile
  }
}
