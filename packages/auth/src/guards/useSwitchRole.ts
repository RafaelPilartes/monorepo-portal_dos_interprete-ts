import { useCallback } from 'react'
import { toast } from 'sonner'
import { DataError } from '@portal-dos-interpretes/data'
import { errorFor } from '@portal-dos-interpretes/core/errors'
import { usePortalServices } from '../services/PortalServices'

/**
 * R-ACC-04: records the role as the last active one and opens its app. The session cookie is
 * shared by the apps (ADR-007), so no new sign-in. A failure is said, never hidden.
 */
export function useSwitchRole(): (role: 'requester' | 'interpreter') => Promise<void> {
  const services = usePortalServices()
  return useCallback(async (role) => {
    if (!services) return
    try {
      const result = await services.api.post<{ app_url: string }>('/me/active-role', { role })
      window.location.assign(result.app_url)
    } catch (error) {
      console.error('[auth] role switch failed', error)
      toast.error(error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message)
    }
  }, [services])
}
