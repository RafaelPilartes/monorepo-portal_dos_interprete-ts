import { useSession } from '@portal-dos-interpretes/auth'
import { RequestList } from '@portal-dos-interpretes/features/requests/RequestList'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'

// /history (requests-core.md): the requests that ended (completed, cancelled, expired).
export default function RequestHistory() {
  const session = useSession()
  const inOrganization = session.status === 'authenticated' && session.account.organizations.length > 0
  return (
    <>
      <PageHeader title="Histórico de Solicitações" description="Os pedidos concluídos, cancelados ou expirados." />
      <RequestList finished inOrganization={inOrganization} />
    </>
  )
}
