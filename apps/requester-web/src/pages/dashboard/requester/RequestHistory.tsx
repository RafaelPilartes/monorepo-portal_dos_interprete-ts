import { useRequestContext, useSession } from '@portal-dos-interpretes/auth'
import { RequestList } from '@portal-dos-interpretes/features/requests/RequestList'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'

// /history (requests-core.md): the requests that ended (completed, cancelled, expired).
export default function RequestHistory() {
  const session = useSession()
  // "A pedir como" in the header decides whose requests these are.
  const [organizationId] = useRequestContext(session.status === 'authenticated' ? session.account : null)
  return (
    <>
      <PageHeader title="Histórico de Solicitações" description="Os pedidos concluídos, cancelados ou expirados." />
      <RequestList finished organizationId={organizationId} />
    </>
  )
}
