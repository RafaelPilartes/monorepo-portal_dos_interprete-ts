import { useMemo } from 'react'
import { useRequiredPortalServices } from '@portal-dos-interpretes/auth'
import { BaseSupabaseDAO, ReadOnlyDAO, translatePostgrestError } from '@portal-dos-interpretes/data'
import type { Tables } from '@portal-dos-interpretes/db-types'

// Reads of requester-web by RLS (api.md §16), and the organisation's open columns written directly
// by owner and admin (data-model.md §1, "U coluna"). Everything else is written through the API.

export type OrganizationRow = Tables<{ schema: 'identity' }, 'organizations'>
export type MemberRow = Tables<{ schema: 'identity' }, 'organization_member_directory'>
export type InviteRow = Omit<Tables<{ schema: 'identity' }, 'organization_invites'>, 'token_hash'>
export type OrganizationUpdate = Pick<OrganizationRow, 'name' | 'sector' | 'address' | 'city' | 'website_url' | 'phone'>

/** The invites without the token hash, which the session cannot read (column grants). */
class InvitesDAO extends ReadOnlyDAO<InviteRow> {
  async pendingOf(organizationId: string): Promise<InviteRow[]> {
    const { data, error } = await this.table()
      .select('id, organization_id, email, role, invited_by, expires_at, status, accepted_by, decided_at, created_at')
      .eq('organization_id', organizationId).eq('status', 'pending').order('created_at', { ascending: false })
    if (error) throw translatePostgrestError(error, this.where)
    return (data ?? []) as InviteRow[]
  }
}

export function useRepositories() {
  const { client } = useRequiredPortalServices()
  return useMemo(
    () => ({
      organizations: new BaseSupabaseDAO<OrganizationRow, never, OrganizationUpdate>(client, 'identity', 'organizations'),
      members: new ReadOnlyDAO<MemberRow>(client, 'identity', 'organization_member_directory', ['full_name', 'email'], 'account_id'),
      invites: new InvitesDAO(client, 'identity', 'organization_invites'),
    }),
    [client],
  )
}
