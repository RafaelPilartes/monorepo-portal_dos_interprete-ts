import { Link } from 'react-router-dom'
import { useRequestContext, useSession } from '@portal-dos-interpretes/auth'
import { RequestList } from '@portal-dos-interpretes/features/requests/RequestList'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Plus } from 'lucide-react'

// /requests (requests-core.md): the requests still running.
export default function RequesterRequests() {
  const session = useSession()
  // "A pedir como" in the header decides whose requests these are.
  const [organizationId] = useRequestContext(session.status === 'authenticated' ? session.account : null)
  return (
    <>
      <PageHeader title="Minhas Solicitações" description="Os teus pedidos em curso." action={<Button asChild><Link to="/requests/new"><Plus className="h-4 w-4" />Nova solicitação</Link></Button>} />
      <RequestList finished={false} organizationId={organizationId} />
    </>
  )
}
