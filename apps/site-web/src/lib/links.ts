import { interpreterProfilePath } from '@portal-dos-interpretes/features/routes'
import { appUrl } from '@portal-dos-interpretes/ui/lib/app-urls'

/** Registration and login live in requester-web (architecture.md §3). */
export const registerUrl = (): string => appUrl('requester', '/register')
/** Interpreters register in their own app (architecture.md §3, interpreter-web). */
export const interpreterRegisterUrl = (): string => appUrl('interpreter', '/register')
export const loginUrl = (): string => appUrl('requester', '/login')

/**
 * A visitor cannot open an interpreter profile (D-05): the card leads to the
 * requester login, which returns to the profile after signing in.
 */
export const interpreterProfileLoginUrl = (slug: string): string =>
  appUrl('requester', `/login?returnTo=${encodeURIComponent(interpreterProfilePath(slug))}`)
