import { useMemo } from 'react'
import { useRequiredPortalServices } from '@portal-dos-interpretes/auth'
import { ReadOnlyDAO } from '@portal-dos-interpretes/data'
import type { Tables } from '@portal-dos-interpretes/db-types'

// Reads of admin-web, by RLS (api.md §16): each is one table or view of one schema.

export type StaffRow = Tables<{ schema: 'identity' }, 'staff_directory'>
export type ConfigVersionRow = Tables<{ schema: 'config' }, 'platform_versions'>
export type LegalDocumentRow = Tables<{ schema: 'identity' }, 'legal_documents'>
export type DocumentTypeRow = Tables<{ schema: 'config' }, 'verification_document_types'>
export type AuditRow = Tables<{ schema: 'audit' }, 'events_for_staff'>

export function useRepositories() {
  const { client } = useRequiredPortalServices()
  return useMemo(
    () => ({
      staff: new ReadOnlyDAO<StaffRow>(client, 'identity', 'staff_directory', ['full_name', 'email'], 'account_id'),
      configVersions: new ReadOnlyDAO<ConfigVersionRow>(client, 'config', 'platform_versions'),
      legalDocuments: new ReadOnlyDAO<LegalDocumentRow>(client, 'identity', 'legal_documents'),
      documentTypes: new ReadOnlyDAO<DocumentTypeRow>(client, 'config', 'verification_document_types'),
      audit: new ReadOnlyDAO<AuditRow>(client, 'audit', 'events_for_staff', ['action', 'actor_name', 'entity_id']),
    }),
    [client],
  )
}
