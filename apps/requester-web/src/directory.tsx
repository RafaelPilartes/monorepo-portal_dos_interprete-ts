import { useMemo, type ReactNode } from 'react'
import { useRequiredPortalServices, useSession } from '@portal-dos-interpretes/auth'
import { DirectoryProvider } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { DirectoryRepository } from '@portal-dos-interpretes/features/directory/data'
import { BillingProvider } from '@portal-dos-interpretes/features/billing/Billing'
import { BillingRepository } from '@portal-dos-interpretes/features/billing/data'
import { RequestsRepository } from '@portal-dos-interpretes/features/requests/data'
import { RequestsProvider } from '@portal-dos-interpretes/features/requests/RequestsContext'

/**
 * The data of the requester area: the directory (favorites for the signed-in requester, R-DIR-10)
 * and the requests (reads by RLS, writes through the API).
 */
export function RequesterDirectory({ children }: { children: ReactNode }) {
  const { client, api } = useRequiredPortalServices()
  const session = useSession()
  const directory = useMemo(() => new DirectoryRepository(client), [client])
  const requests = useMemo(() => new RequestsRepository(client, api), [client, api])
  const billing = useMemo(() => new BillingRepository(client, api), [client, api])
  const account = session.status === 'authenticated' ? session.account : null
  return (
    <DirectoryProvider repository={directory} accountId={account?.id ?? null} canFavorite={account?.roles.includes('requester') ?? false}>
      <RequestsProvider repository={requests} accountId={account?.id ?? ''}>
        <BillingProvider repository={billing}>{children}</BillingProvider>
      </RequestsProvider>
    </DirectoryProvider>
  )
}
