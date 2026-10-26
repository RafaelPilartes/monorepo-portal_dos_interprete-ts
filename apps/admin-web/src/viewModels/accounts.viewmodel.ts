import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRequiredPortalServices } from '@portal-dos-interpretes/auth'
import { useRepositories, type AccountKind, type AccountRow, type ConsentRow, type DirectoryQuery, type MemberRow, type OrganizationRow } from '@/data/repositories'

// Accounts and organisations for the team (accounts-and-organizations.md, admin-web): lists
// paginated on the server (R-ADM-06), sheets, and suspension/reactivation through the API
// (R-ACC-05, R-ACC-06). No optimistic update: the screen shows the state the API answers.

export const DIRECTORY_PAGE_SIZE = 20

const keys = {
  accounts: (kind: AccountKind, query: DirectoryQuery) => ['accounts', kind, query] as const,
  account: (id: string) => ['account', id] as const,
  accountOrganizations: (id: string) => ['account', id, 'organizations'] as const,
  accountConsents: (id: string) => ['account', id, 'consents'] as const,
  organizations: (query: DirectoryQuery) => ['organizations', query] as const,
  organization: (id: string) => ['organization', id] as const,
  organizationMembers: (id: string) => ['organization', id, 'members'] as const,
}

export function useAccounts(kind: AccountKind, query: DirectoryQuery) {
  const repositories = useRepositories()
  return useQuery({
    queryKey: keys.accounts(kind, query),
    queryFn: () => repositories.accounts.listKind(kind, query),
    placeholderData: keepPreviousData,
  })
}

export function useAccount(id: string) {
  const repositories = useRepositories()
  return useQuery({ queryKey: keys.account(id), queryFn: async (): Promise<AccountRow | null> => repositories.accounts.getById(id) })
}

/** The organisations an account belongs or belonged to. */
export function useAccountOrganizations(id: string) {
  const repositories = useRepositories()
  return useQuery({
    queryKey: keys.accountOrganizations(id),
    queryFn: async (): Promise<MemberRow[]> => (await repositories.members.list({ filters: { account_id: id }, orderBy: 'joined_at' })).data,
  })
}

export function useAccountConsents(id: string) {
  const repositories = useRepositories()
  return useQuery({
    queryKey: keys.accountConsents(id),
    queryFn: async (): Promise<ConsentRow[]> => (await repositories.consents.list({ filters: { account_id: id }, orderBy: 'accepted_at', ascending: false })).data,
  })
}

export function useOrganizations(query: DirectoryQuery) {
  const repositories = useRepositories()
  return useQuery({ queryKey: keys.organizations(query), queryFn: () => repositories.organizations.listPage(query), placeholderData: keepPreviousData })
}

export function useOrganization(id: string) {
  const repositories = useRepositories()
  return useQuery({ queryKey: keys.organization(id), queryFn: async (): Promise<OrganizationRow | null> => repositories.organizations.getById(id) })
}

export function useOrganizationMembers(id: string) {
  const repositories = useRepositories()
  return useQuery({
    queryKey: keys.organizationMembers(id),
    queryFn: async (): Promise<MemberRow[]> => (await repositories.members.list({ filters: { organization_id: id }, orderBy: 'joined_at' })).data,
  })
}

/** Suspend or reactivate an account or an organisation; refreshes lists and sheets. */
export function useSuspension(target: 'accounts' | 'organizations', id: string) {
  const { api } = useRequiredPortalServices()
  const queryClient = useQueryClient()
  const refresh = () => Promise.all(['accounts', 'account', 'organizations', 'organization'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
  return {
    suspend: useMutation({ mutationFn: (reason: string) => api.post(`/admin/${target}/${id}/suspend`, { reason }), onSettled: refresh }),
    reactivate: useMutation({ mutationFn: () => api.post(`/admin/${target}/${id}/reactivate`), onSettled: refresh }),
  }
}
