import { useMemo, type ReactNode } from 'react'
import { useRequiredPortalServices, useSession } from '@portal-dos-interpretes/auth'
import { DirectoryProvider } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { DirectoryRepository } from '@portal-dos-interpretes/features/directory/data'
import { BillingProvider } from '@portal-dos-interpretes/features/billing/Billing'
import { BillingRepository } from '@portal-dos-interpretes/features/billing/data'
import { RequestsRepository } from '@portal-dos-interpretes/features/requests/data'
import { RequestsProvider } from '@portal-dos-interpretes/features/requests/RequestsContext'

/** The data of the interpreter area: colleagues' profiles, the interpreter's own rows, its requests. */
export function InterpreterDirectory({ children }: { children: ReactNode }) {
  const { client, api } = useRequiredPortalServices()
  const session = useSession()
  const repository = useMemo(() => new DirectoryRepository(client), [client])
  const requests = useMemo(() => new RequestsRepository(client, api), [client, api])
  const billing = useMemo(() => new BillingRepository(client, api), [client, api])
  const accountId = session.status === 'authenticated' ? session.account.id : null
  return (
    <DirectoryProvider repository={repository} accountId={accountId} canFavorite={false}>
      <RequestsProvider repository={requests} accountId={accountId ?? ''}>
        <BillingProvider repository={billing}>{children}</BillingProvider>
      </RequestsProvider>
    </DirectoryProvider>
  )
}
