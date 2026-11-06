import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { useRequiredPortalServices, useSession } from '@portal-dos-interpretes/auth'
import { RequestsRepository } from '@portal-dos-interpretes/features/requests/data'
import { RequestsProvider } from '@portal-dos-interpretes/features/requests/RequestsContext'

/** The requests for the team (R-REQ-07: staff read every request): reads by RLS, writes through the API. */
export default function AdminRequestsArea() {
  const { client, api } = useRequiredPortalServices()
  const session = useSession()
  const repository = useMemo(() => new RequestsRepository(client, api), [client, api])
  return (
    <RequestsProvider repository={repository} accountId={session.status === 'authenticated' ? session.account.id : ''}>
      <Outlet />
    </RequestsProvider>
  )
}
