import { useMemo } from 'react'
import { useRequiredPortalServices } from '@portal-dos-interpretes/auth'
import { ReadOnlyDAO, translatePostgrestError } from '@portal-dos-interpretes/data'
import type { ListResponse } from '@portal-dos-interpretes/data'
import type { Tables } from '@portal-dos-interpretes/db-types'

// Reads of admin-web, by RLS (api.md §16): each is one table or view of one schema.

export type StaffRow = Tables<{ schema: 'identity' }, 'staff_directory'>
export type ConfigVersionRow = Tables<{ schema: 'config' }, 'platform_versions'>
export type LegalDocumentRow = Tables<{ schema: 'identity' }, 'legal_documents'>
export type DocumentTypeRow = Tables<{ schema: 'config' }, 'verification_document_types'>
export type AuditRow = Tables<{ schema: 'audit' }, 'events_for_staff'>
export type AccountRow = Tables<{ schema: 'identity' }, 'account_directory'>
export type OrganizationRow = Tables<{ schema: 'identity' }, 'organization_directory'>
export type MemberRow = Tables<{ schema: 'identity' }, 'organization_member_directory'>
export type ConsentRow = Tables<{ schema: 'identity' }, 'consent_history'>

export type AccountKind = 'requester' | 'interpreter'
export interface DirectoryQuery {
  q?: string | undefined
  status?: 'active' | 'suspended' | 'anonymized' | undefined
  page: number
  pageSize: number
}

// PostgREST or() breaks on commas and parentheses; they are not useful in a search.
const safeTerm = (term: string) => term.trim().replace(/[,()]/g, ' ')

/** /requesters and /interpreters (R-ADM-06): paginated on the server, search by name or email. */
class AccountDirectoryDAO extends ReadOnlyDAO<AccountRow> {
  async listKind(kind: AccountKind, query: DirectoryQuery): Promise<ListResponse<AccountRow>> {
    let request = this.table().select('*', { count: 'exact' })
    request = kind === 'interpreter' ? request.eq('is_interpreter', true) : request.or('is_individual_requester.eq.true,is_org_member.eq.true')
    if (query.status) request = request.eq('status', query.status)
    const term = query.q ? safeTerm(query.q) : ''
    if (term) request = request.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
    const offset = (query.page - 1) * query.pageSize
    const { data, error, count } = await request.order('created_at', { ascending: false }).range(offset, offset + query.pageSize - 1)
    if (error) throw translatePostgrestError(error, this.where)
    const rows = (data ?? []) as AccountRow[]
    return { data: rows, pagination: { limit: query.pageSize, offset, count: rows.length, total: count ?? undefined } }
  }
}

/** /organizations: paginated on the server, search by name or NIF. */
class OrganizationDirectoryDAO extends ReadOnlyDAO<OrganizationRow> {
  async listPage(query: DirectoryQuery): Promise<ListResponse<OrganizationRow>> {
    let request = this.table().select('*', { count: 'exact' })
    if (query.status) request = request.eq('status', query.status)
    const term = query.q ? safeTerm(query.q) : ''
    if (term) request = request.or(`name.ilike.%${term}%,nif.ilike.%${term}%`)
    const offset = (query.page - 1) * query.pageSize
    const { data, error, count } = await request.order('created_at', { ascending: false }).range(offset, offset + query.pageSize - 1)
    if (error) throw translatePostgrestError(error, this.where)
    const rows = (data ?? []) as OrganizationRow[]
    return { data: rows, pagination: { limit: query.pageSize, offset, count: rows.length, total: count ?? undefined } }
  }
}

export function useRepositories() {
  const { client } = useRequiredPortalServices()
  return useMemo(
    () => ({
      staff: new ReadOnlyDAO<StaffRow>(client, 'identity', 'staff_directory', ['full_name', 'email'], 'account_id'),
      configVersions: new ReadOnlyDAO<ConfigVersionRow>(client, 'config', 'platform_versions'),
      legalDocuments: new ReadOnlyDAO<LegalDocumentRow>(client, 'identity', 'legal_documents'),
      documentTypes: new ReadOnlyDAO<DocumentTypeRow>(client, 'config', 'verification_document_types'),
      audit: new ReadOnlyDAO<AuditRow>(client, 'audit', 'events_for_staff', ['action', 'actor_name', 'entity_id']),
      accounts: new AccountDirectoryDAO(client, 'identity', 'account_directory'),
      organizations: new OrganizationDirectoryDAO(client, 'identity', 'organization_directory'),
      members: new ReadOnlyDAO<MemberRow>(client, 'identity', 'organization_member_directory', [], 'account_id'),
      consents: new ReadOnlyDAO<ConsentRow>(client, 'identity', 'consent_history'),
    }),
    [client],
  )
}
