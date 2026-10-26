import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRefreshSession, useRequestContext, useRequiredPortalServices, useSession, type AccountOrganization } from '@portal-dos-interpretes/auth'
import { useRepositories, type InviteRow, type MemberRow, type OrganizationRow, type OrganizationUpdate } from '@/data/repositories'

// The organisation of requester-web (accounts-and-organizations.md, R-ORG-02..05): reads by RLS,
// changes through the API (the rules are in the identity functions); each refreshes what it changed.

const keys = {
  organization: (id: string) => ['organization', id] as const,
  members: (id: string) => ['organization', id, 'members'] as const,
  invites: (id: string) => ['organization', id, 'invites'] as const,
}

/** The organisation the screen is about: the one chosen in "A pedir como", else the first one. */
export function useCurrentOrganization(): AccountOrganization | null {
  const session = useSession()
  const account = session.status === 'authenticated' ? session.account : null
  const [context] = useRequestContext(account)
  const organizations = account?.organizations.filter((org) => org.status !== 'anonymized') ?? []
  return organizations.find((org) => org.id === context) ?? organizations[0] ?? null
}

export function useOrganization(id: string) {
  const repositories = useRepositories()
  return useQuery({ queryKey: keys.organization(id), queryFn: async (): Promise<OrganizationRow | null> => repositories.organizations.getById(id) })
}

export function useMembers(id: string) {
  const repositories = useRepositories()
  return useQuery({
    queryKey: keys.members(id),
    queryFn: async (): Promise<MemberRow[]> =>
      (await repositories.members.list({ filters: { organization_id: id, status: 'active' }, orderBy: 'joined_at', ascending: true })).data,
  })
}

export function useInvites(id: string, enabled: boolean) {
  const repositories = useRepositories()
  return useQuery({ queryKey: keys.invites(id), queryFn: async (): Promise<InviteRow[]> => repositories.invites.pendingOf(id), enabled })
}

export function useOrganizationMutations(id: string) {
  const { api } = useRequiredPortalServices()
  const repositories = useRepositories()
  const queryClient = useQueryClient()
  const refreshSession = useRefreshSession()
  const refresh = (...queryKeys: (readonly unknown[])[]) => Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
  return {
    update: useMutation({
      mutationFn: (values: OrganizationUpdate) => repositories.organizations.update(id, values),
      onSettled: async () => {
        await refresh(keys.organization(id))
        await refreshSession()
      },
    }),
    invite: useMutation({
      mutationFn: (input: { email: string; role: 'admin' | 'member' }) => api.post(`/organizations/${id}/invites`, input),
      onSettled: () => refresh(keys.invites(id)),
    }),
    revoke: useMutation({
      mutationFn: (inviteId: string) => api.post(`/organizations/${id}/invites/${inviteId}/revoke`),
      onSettled: () => refresh(keys.invites(id)),
    }),
    setRole: useMutation({
      mutationFn: (input: { accountId: string; role: 'admin' | 'member' }) => api.patch(`/organizations/${id}/members/${input.accountId}`, { role: input.role }),
      onSettled: () => refresh(keys.members(id)),
    }),
    remove: useMutation({
      mutationFn: (accountId: string) => api.post(`/organizations/${id}/members/${accountId}/remove`),
      onSettled: async () => {
        await refresh(keys.members(id))
        await refreshSession()
      },
    }),
    transfer: useMutation({
      mutationFn: (newOwner: string) => api.post(`/organizations/${id}/transfer-ownership`, { new_owner_account_id: newOwner }),
      onSettled: async () => {
        await refresh(keys.members(id))
        await refreshSession()
      },
    }),
  }
}
