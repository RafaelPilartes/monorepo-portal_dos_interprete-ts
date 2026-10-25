import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditLogUseCase } from '@/domain/usecases/AuditLogUseCase'
import { AuditLogEntity } from '@/core/entities/system/AuditLogEntity'
import { toast } from 'sonner'

export const AUDIT_LOG_KEYS = {
  all: ['auditLogs'] as const,
  lists: () => [...AUDIT_LOG_KEYS.all, 'list'] as const,
  list: (filters: string) => [...AUDIT_LOG_KEYS.lists(), { filters }] as const,
  details: () => [...AUDIT_LOG_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...AUDIT_LOG_KEYS.details(), id] as const
}

export function useAuditLogViewModel() {
  const queryClient = useQueryClient()

  const getAllAuditLogs = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: AUDIT_LOG_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => auditLogUseCase.getAllAuditLogs(limit, offset, searchTerm)
    })
  }

  const getAuditLogById = (id: string) => {
    return useQuery({
      queryKey: AUDIT_LOG_KEYS.detail(id),
      queryFn: () => auditLogUseCase.getAuditLogById(id),
      enabled: !!id
    })
  }

  const updateAuditLog = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AuditLogEntity> }) =>
      auditLogUseCase.updateAuditLog(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: AUDIT_LOG_KEYS.all })
      queryClient.setQueryData(AUDIT_LOG_KEYS.detail(updatedData.id), updatedData)
      toast.success('Log de auditoria atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar log', {
        description: error.message
      })
    }
  })

  return {
    getAllAuditLogs,
    getAuditLogById,
    updateAuditLog
  }
}
