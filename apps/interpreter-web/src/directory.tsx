import { useMemo, type ReactNode } from 'react'
import { useRequiredPortalServices, useSession } from '@portal-dos-interpretes/auth'
import { DirectoryProvider } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { DirectoryRepository } from '@portal-dos-interpretes/features/directory/data'

/** The directory for the interpreter area: colleagues' profiles and the interpreter's own rows. */
export function InterpreterDirectory({ children }: { children: ReactNode }) {
  const { client } = useRequiredPortalServices()
  const session = useSession()
  const repository = useMemo(() => new DirectoryRepository(client), [client])
  const accountId = session.status === 'authenticated' ? session.account.id : null
  return <DirectoryProvider repository={repository} accountId={accountId} canFavorite={false}>{children}</DirectoryProvider>
}
