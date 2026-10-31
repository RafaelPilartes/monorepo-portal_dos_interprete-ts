import { useMemo, type ReactNode } from 'react'
import { useRequiredPortalServices, useSession } from '@portal-dos-interpretes/auth'
import { DirectoryProvider } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { DirectoryRepository } from '@portal-dos-interpretes/features/directory/data'

/** The directory for the requester area: reads by RLS, favorites for the signed-in requester (R-DIR-10). */
export function RequesterDirectory({ children }: { children: ReactNode }) {
  const { client } = useRequiredPortalServices()
  const session = useSession()
  const repository = useMemo(() => new DirectoryRepository(client), [client])
  const account = session.status === 'authenticated' ? session.account : null
  return (
    <DirectoryProvider repository={repository} accountId={account?.id ?? null} canFavorite={account?.roles.includes('requester') ?? false}>
      {children}
    </DirectoryProvider>
  )
}
