import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UserRole } from '@/type/enum'
import { PREVIEW_USERS, TEAM_NOT_CONNECTED_MESSAGE } from './team-preview-data'

/** Stand-in for the legacy user view model used by the team screen (AD-014). */
export const useUserViewModel = () => {
  const getAllUsers = (limit?: number, offset?: number, searchTerm?: string, _filters?: { role?: UserRole }) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- same shape as the legacy view model; called unconditionally at the top of the page (AD-014)
    useQuery({
      queryKey: ['users', 'preview', { limit, offset, searchTerm }],
      queryFn: async () => {
        const term = searchTerm?.toLowerCase() ?? ''
        const data = PREVIEW_USERS.filter((user) => !term || `${user.name} ${user.email}`.toLowerCase().includes(term))
        return { data, pagination: { total: data.length, count: data.length } }
      },
    })

  const updateUser = async (_args: { id: string; data: { role?: UserRole } }): Promise<never> => {
    toast.error(TEAM_NOT_CONNECTED_MESSAGE)
    throw new Error(TEAM_NOT_CONNECTED_MESSAGE)
  }

  return { getAllUsers, updateUser }
}
