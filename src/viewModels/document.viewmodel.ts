import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentUseCase } from '@/domain/usecases/DocumentUseCase'
import { DocumentEntity } from '@/core/entities/system/DocumentEntity'
import { toast } from 'sonner'

export const DOCUMENT_KEYS = {
  all: ['documents'] as const,
  lists: () => [...DOCUMENT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...DOCUMENT_KEYS.lists(), { filters }] as const,
  details: () => [...DOCUMENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...DOCUMENT_KEYS.details(), id] as const
}

export function useDocumentViewModel() {
  const queryClient = useQueryClient()

  const getAllDocuments = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: DOCUMENT_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => documentUseCase.getAllDocuments(limit, offset, searchTerm)
    })
  }

  const getDocumentById = (id: string) => {
    return useQuery({
      queryKey: DOCUMENT_KEYS.detail(id),
      queryFn: () => documentUseCase.getDocumentById(id),
      enabled: !!id
    })
  }

  const updateDocument = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DocumentEntity> }) =>
      documentUseCase.updateDocument(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.all })
      queryClient.setQueryData(DOCUMENT_KEYS.detail(updatedData.id), updatedData)
      toast.success('Documento atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar documento', {
        description: error.message
      })
    }
  })

  return {
    getAllDocuments,
    getDocumentById,
    updateDocument
  }
}
