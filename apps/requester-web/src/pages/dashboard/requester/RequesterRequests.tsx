import { Link } from 'react-router-dom'
import { useSession } from '@portal-dos-interpretes/auth'
import { RequestList } from '@portal-dos-interpretes/features/requests/RequestList'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Plus } from 'lucide-react'

// /requests (requests-core.md): the requests still running.
export default function RequesterRequests() {
  const session = useSession()
  const inOrganization = session.status === 'authenticated' && session.account.organizations.length > 0
  return (
    <>
      <PageHeader title="Minhas Solicitações" description="Os teus pedidos em curso." action={<Button asChild><Link to="/requests/new"><Plus className="h-4 w-4" />Nova solicitação</Link></Button>} />
      <RequestList finished={false} inOrganization={inOrganization} />
    </>
  )
}
