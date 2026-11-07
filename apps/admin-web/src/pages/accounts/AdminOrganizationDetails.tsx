import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '@portal-dos-interpretes/auth'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { formatDate, formatDateTime, ORG_ROLE_LABELS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { ConfirmationModal } from '@portal-dos-interpretes/ui/components/confirmation-modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization, useOrganizationMembers, useSuspension } from '@/viewModels/accounts.viewmodel'
import { statusLabel, statusVariant } from './directory'
import { SuspendDialog } from './SuspendDialog'

// /organizations/:id (accounts-and-organizations.md): data, members (also those who left), state,
// and "Suspender" / "Reactivar" for moderators (R-ACC-05, R-ACC-06). Requests join with H5.

export default function AdminOrganizationDetails() {
  const { id = '' } = useParams()
  const session = useSession()
  const level = session.status === 'authenticated' ? session.account.staffLevel : null
  const canModerate = level === 'moderator' || level === 'super_admin'
  const organization = useOrganization(id)
  const members = useOrganizationMembers(id)
  const { suspend, reactivate } = useSuspension('organizations', id)
  const [suspending, setSuspending] = useState(false)
  const [reactivating, setReactivating] = useState(false)

  const header = (
    <Link to="/organizations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />Organizações
    </Link>
  )
  if (organization.isPending) return <>{header}<TableSkeleton rows={6} /></>
  if (organization.isError) return <>{header}<QueryError error={organization.error} onRetry={() => void organization.refetch()} /></>
  if (!organization.data) return <>{header}<p className="text-sm text-muted-foreground">Não encontrámos esta organização.</p></>
  const org = organization.data
  const facts: [string, string | null][] = [
    ['NIF', org.nif], ['Sector', org.sector], ['Cidade', org.city], ['Telefone', org.phone], ['Morada', org.address], ['Site', org.website_url],
    ['Criada', org.created_at ? formatDate(org.created_at) : null],
  ]

  return (
    <>
      {header}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="flex flex-wrap items-center gap-3 text-[1.375rem] font-semibold leading-tight tracking-tight">
          {org.name}
          <Badge variant={statusVariant(org.status)}>{statusLabel(org.status)}</Badge>
        </h1>
        {canModerate && org.status === 'active' && <Button variant="destructive" onClick={() => setSuspending(true)}>Suspender</Button>}
        {canModerate && org.status === 'suspended' && <Button onClick={() => setReactivating(true)}>Reactivar</Button>}
      </div>
      {org.status === 'suspended' && (
        <div role="status" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          Suspensa desde {org.suspended_at ? formatDateTime(org.suspended_at) : '—'}. Motivo: {org.suspended_reason ?? '—'}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Dados</CardTitle></CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              {facts.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[6rem_1fr] gap-3 py-2 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 break-words">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Membros</CardTitle></CardHeader>
          <CardContent>
            {members.isPending ? <TableSkeleton rows={3} />
              : members.isError ? <QueryError error={members.error} onRetry={() => void members.refetch()} />
              : members.data.length === 0 ? <p className="text-sm text-muted-foreground">Sem membros.</p>
              : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="hidden sm:table-cell">Email</TableHead><TableHead>Papel</TableHead><TableHead className="hidden md:table-cell">Desde</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {members.data.map((member) => (
                      <TableRow key={member.account_id}>
                        <TableCell><Link to={`/requesters/${member.account_id}`} className="font-medium hover:text-primary hover:underline">{member.full_name}</Link></TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">{member.email}</TableCell>
                        <TableCell>
                          {ORG_ROLE_LABELS[member.role as keyof typeof ORG_ROLE_LABELS] ?? member.role}
                          {member.status === 'removed' && <span className="ml-1.5 text-xs text-muted-foreground">(saiu)</span>}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{member.joined_at ? formatDate(member.joined_at) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>
      </div>
      <SuspendDialog open={suspending} onOpenChange={setSuspending} kind="organization" name={org.name ?? ''} suspend={suspend} />
      <ConfirmationModal
        open={reactivating}
        onOpenChange={setReactivating}
        title={`Reactivar ${org.name}?`}
        description="A organização volta a poder criar pedidos. O que foi cancelado durante a suspensão não volta."
        confirmLabel="Reactivar"
        variant="info"
        isLoading={reactivate.isPending}
        onConfirm={() => reactivate.mutate(undefined, {
          onSuccess: () => {
            toast.success('Organização reactivada.')
            setReactivating(false)
          },
          onError: (error) => toast.error(errorMessage(error)),
        })}
      />
    </>
  )
}
