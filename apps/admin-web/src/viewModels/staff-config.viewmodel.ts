import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRequiredPortalServices } from '@portal-dos-interpretes/auth'
import { useRepositories, type AuditRow, type ConfigVersionRow, type DocumentTypeRow, type LegalDocumentRow, type StaffRow } from '@/data/repositories'

// View models of step H1 (staff-and-config.md): queries read by RLS, mutations call the API and
// refresh what they changed. Errors reach the screen as DataError (catalog code and message).

export type StaffLevel = 'super_admin' | 'moderator' | 'finance' | 'request_operator'

export const queryKeys = {
  staff: ['staff'] as const,
  configVersions: ['config-versions'] as const,
  legalDocuments: ['legal-documents'] as const,
  documentTypes: ['document-types'] as const,
  audit: (filters: AuditFilters) => ['audit', filters] as const,
}

export function useStaffList() {
  const repositories = useRepositories()
  return useQuery({
    queryKey: queryKeys.staff,
    queryFn: async (): Promise<StaffRow[]> => (await repositories.staff.list({ orderBy: 'created_at', ascending: true })).data,
  })
}

export function useStaffMutations() {
  const { api } = useRequiredPortalServices()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.staff })
  return {
    add: useMutation({
      mutationFn: (input: { email: string; level: StaffLevel }) => api.post('/admin/staff', input),
      onSuccess: refresh,
    }),
    change: useMutation({
      mutationFn: (input: { accountId: string; level?: StaffLevel | undefined; active?: boolean | undefined }) =>
        api.patch(`/admin/staff/${input.accountId}`, { level: input.level, active: input.active }),
      onSuccess: refresh,
    }),
  }
}

export function useConfigVersions() {
  const repositories = useRepositories()
  return useQuery({
    queryKey: queryKeys.configVersions,
    queryFn: async (): Promise<ConfigVersionRow[]> =>
      (await repositories.configVersions.list({ orderBy: 'version_number', ascending: false })).data,
  })
}

export function useConfigMutations() {
  const { api } = useRequiredPortalServices()
  const queryClient = useQueryClient()
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.configVersions }),
      queryClient.invalidateQueries({ queryKey: ['audit'] }),
    ])
  return {
    createDraft: useMutation({
      mutationFn: (fromVersionId?: string) => api.post<ConfigVersionRow>('/admin/config/versions', fromVersionId ? { from_version_id: fromVersionId } : {}),
      onSuccess: refresh,
    }),
    updateDraft: useMutation({
      mutationFn: (input: { id: string; values: Record<string, number | boolean | string | null>; notes?: string }) =>
        api.patch<ConfigVersionRow>(`/admin/config/versions/${input.id}`, { values: input.values, notes: input.notes }),
      onSuccess: refresh,
    }),
    publish: useMutation({
      mutationFn: (input: { id: string; expectedCurrentVersionId: string | null }) =>
        api.post<ConfigVersionRow>(`/admin/config/versions/${input.id}/publish`, { expected_current_version_id: input.expectedCurrentVersionId }),
      onSuccess: refresh,
    }),
  }
}

export function useLegalDocuments() {
  const repositories = useRepositories()
  return useQuery({
    queryKey: queryKeys.legalDocuments,
    queryFn: async (): Promise<LegalDocumentRow[]> => (await repositories.legalDocuments.list({ orderBy: 'version', ascending: false })).data,
  })
}

export function useLegalMutations() {
  const { api } = useRequiredPortalServices()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.legalDocuments })
  return {
    create: useMutation({
      mutationFn: (input: { kind: 'terms' | 'privacy'; body: string }) => api.post<LegalDocumentRow>('/admin/legal-documents', input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: (input: { id: string; body: string }) => api.patch<LegalDocumentRow>(`/admin/legal-documents/${input.id}`, { body: input.body }),
      onSuccess: refresh,
    }),
    publish: useMutation({
      mutationFn: (id: string) => api.post<LegalDocumentRow>(`/admin/legal-documents/${id}/publish`),
      onSuccess: refresh,
    }),
  }
}

export function useDocumentTypes() {
  const repositories = useRepositories()
  return useQuery({
    queryKey: queryKeys.documentTypes,
    queryFn: async (): Promise<DocumentTypeRow[]> => (await repositories.documentTypes.list({ orderBy: 'sort', ascending: true })).data,
  })
}

export interface DocumentTypeInput {
  code: string
  name: string
  description: string
  required: boolean
  active: boolean
  sort: number
}

export function useDocumentTypeMutations() {
  const { api } = useRequiredPortalServices()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.documentTypes })
  return {
    save: useMutation({
      mutationFn: (input: DocumentTypeInput & { id?: string }) => {
        const { id, ...body } = input
        return id ? api.patch<DocumentTypeRow>(`/admin/document-types/${id}`, body) : api.post<DocumentTypeRow>('/admin/document-types', body)
      },
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete<void>(`/admin/document-types/${id}`),
      onSuccess: refresh,
    }),
  }
}

export interface AuditFilters {
  page: number
  from?: string | undefined
  to?: string | undefined
  actor?: string | undefined
  action?: string | undefined
  entityType?: string | undefined
}

export const AUDIT_PAGE_SIZE = 25

export function useAuditEvents(filters: AuditFilters) {
  const repositories = useRepositories()
  return useQuery({
    queryKey: queryKeys.audit(filters),
    queryFn: async () => {
      const response = await repositories.audit.list({
        limit: AUDIT_PAGE_SIZE,
        offset: (filters.page - 1) * AUDIT_PAGE_SIZE,
        orderBy: 'occurred_at',
        ascending: false,
        filters: {
          ...(filters.actor ? { actor_account: filters.actor } : {}),
          ...(filters.action ? { action: filters.action } : {}),
          ...(filters.entityType ? { entity_type: filters.entityType } : {}),
        } as Partial<AuditRow>,
        between: { column: 'occurred_at', from: filters.from, to: filters.to },
      })
      return { rows: response.data, total: response.pagination.total ?? response.data.length }
    },
    placeholderData: (previous) => previous,
  })
}
