import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AdminProfileEntity } from '@/core/entities/identity/AdminProfileEntity'
import { PREVIEW_TEAM, TEAM_NOT_CONNECTED_MESSAGE } from './team-preview-data'

/**
 * Stand-in for the legacy view model, same signatures, no network (AD-014).
 * Reads return the preview team; writes reject and say so on screen, so the
 * page never shows a success that did not happen.
 */
export const useAdminProfileViewModel = () => {
  const getAllAdminProfiles = (
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<AdminProfileEntity>,
  ) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- same shape as the legacy view model; called unconditionally at the top of the page (AD-014)
    useQuery({
      queryKey: ['admin-profiles', 'preview', { limit, offset, searchTerm, filters }],
      queryFn: async () => {
        const term = searchTerm?.toLowerCase() ?? ''
        const matching = PREVIEW_TEAM.filter(
          (member) =>
            (!filters?.permission_level || member.permission_level === filters.permission_level) &&
            (!term || `${member.user?.name ?? ''} ${member.user?.email ?? ''}`.toLowerCase().includes(term)),
        )
        const start = offset ?? 0
        const data = limit ? matching.slice(start, start + limit) : matching.slice(start)
        return { data, pagination: { total: matching.length, count: matching.length } }
      },
    })

  const rejectWrite = async (): Promise<never> => {
    toast.error(TEAM_NOT_CONNECTED_MESSAGE)
    throw new Error(TEAM_NOT_CONNECTED_MESSAGE)
  }

  return {
    getAllAdminProfiles,
    createAdminProfile: (_data: Omit<AdminProfileEntity, 'id' | 'created_at' | 'updated_at'>) => rejectWrite(),
    updateAdminProfile: (_args: { id: string; data: Partial<AdminProfileEntity> }) => rejectWrite(),
    isCreating: false,
    isUpdating: false,
  }
}
