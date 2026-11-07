import { createServicesFromEnv } from '@portal-dos-interpretes/auth'
import type { PortalServices } from '@portal-dos-interpretes/auth'

/** The platform services of admin-web, from the environment (.env at the repository root). */
export function createAdminServices(): PortalServices {
  return createServicesFromEnv()
}
