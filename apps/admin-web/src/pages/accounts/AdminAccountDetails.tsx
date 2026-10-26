import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '@portal-dos-interpretes/auth'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { formatDate, formatDateTime, ORG_ROLE_LABELS, STAFF_LEVEL_LABELS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { ConfirmationModal } from '@portal-dos-interpretes/ui/components/confirmation-modal'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { AccountKind, AccountRow } from '@/data/repositories'
import { useAccount, useAccountConsents, useAccountOrganizations, useSuspension } from '@/viewModels/accounts.viewmodel'
import { statusLabel, statusVariant } from './directory'
import { SuspendDialog } from './SuspendDialog'

// /requesters/:id and /interpreters/:id (accounts-and-organizations.md): data, roles,
// organisations, consents, state, and "Suspender" / "Reactivar" for moderators (R-ACC-05/06).
// Requests, reviews and late cancellations join the sheet with their steps (H5, H8, H9).

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

function roles(account: AccountRow): string {
  const list = [
    account.is_individual_requester && 'Solicitante particular',
    account.is_org_member && 'Membro de organização',
    account.is_interpreter && 'Intérprete',
    account.staff_level && `Equipa (${STAFF_LEVEL_LABELS[account.staff_level as keyof typeof STAFF_LEVEL_LABELS] ?? account.staff_level})`,
  ].filter(Boolean)
  return list.length > 0 ? list.join(' · ') : 'Sem papel (onboarding por fazer)'
}

export default function AdminAccountDetails({ kind }: { kind: AccountKind }) {
  const { id = '' } = useParams()
  const session = useSession()
  const level = session.status === 'authenticated' ? session.account.staffLevel : null
  const canModerate = level === 'moderator' || level === 'super_admin'
  const account = useAccount(id)
  const organizations = useAccountOrganizations(id)
  const consents = useAccountConsents(id)
  const { suspend, reactivate } = useSuspension('accounts', id)
  const [suspending, setSuspending] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const back = kind === 'interpreter' ? { href: '/interpreters', label: 'Intérpretes' } : { href: '/requesters', label: 'Solicitantes' }

  const header = (
    <Link to={back.href} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />{back.label}
    </Link>
  )
  if (account.isPending) return <>{header}<TableSkeleton rows={6} /></>
  if (account.isError) return <>{header}<QueryError error={account.error} onRetry={() => void account.refetch()} /></>
  if (!account.data) return <>{header}<p className="text-sm text-muted-foreground">Não encontrámos esta conta.</p></>
  const data = account.data
  const isStaff = !!data.staff_level

  return (
    <>
      {header}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-[1.375rem] font-semibold leading-tight tracking-tight">
            {data.full_name}
            <Badge variant={statusVariant(data.status)}>{statusLabel(data.status)}</Badge>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.email}</p>
        </div>
        {canModerate && !isStaff && data.status === 'active' && (
          <Button variant="destructive" onClick={() => setSuspending(true)}>Suspender</Button>
        )}
        {canModerate && data.status === 'suspended' && (
          <Button onClick={() => setReactivating(true)}>Reactivar</Button>
        )}
      </div>

      {data.status === 'suspended' && (
        <div role="status" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          Suspensa desde {data.suspended_at ? formatDateTime(data.suspended_at) : '—'}. Motivo: {data.suspended_reason ?? '—'}
        </div>
      )}
      {data.status === 'anonymized' && (
        <div role="status" className="mb-6 rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          Conta removida a pedido da pessoa em {data.anonymized_at ? formatDate(data.anonymized_at) : '—'}. Não há dados pessoais a mostrar.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Dados</CardTitle></CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <Row label="Papéis">{roles(data)}</Row>
              <Row label="Telefone">{data.phone ?? '—'}</Row>
              <Row label="Cidade">{data.city ?? '—'}</Row>
              {data.interpreter_slug && <Row label="Perfil público">/{data.interpreter_slug}</Row>}
              <Row label="Conta criada">{data.created_at ? formatDate(data.created_at) : '—'}</Row>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Organizações</CardTitle></CardHeader>
          <CardContent>
            {organizations.isPending ? <TableSkeleton rows={2} />
              : organizations.isError ? <QueryError error={organizations.error} onRetry={() => void organizations.refetch()} />
              : organizations.data.length === 0 ? <p className="text-sm text-muted-foreground">Não pertence a nenhuma organização.</p>
              : (
                <ul className="divide-y divide-border">
                  {organizations.data.map((member) => (
                    <li key={member.organization_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Link to={`/organizations/${member.organization_id}`} className="font-medium hover:text-primary hover:underline">{member.organization_name}</Link>
                      <span className="text-muted-foreground">
                        {ORG_ROLE_LABELS[member.role as keyof typeof ORG_ROLE_LABELS] ?? member.role}
                        {member.status === 'removed' && ' · saiu'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Consentimentos</CardTitle></CardHeader>
          <CardContent>
            {consents.isPending ? <TableSkeleton rows={2} />
              : consents.isError ? <QueryError error={consents.error} onRetry={() => void consents.refetch()} />
              : consents.data.length === 0 ? <p className="text-sm text-muted-foreground">Sem consentimentos registados.</p>
              : (
                <ul className="divide-y divide-border text-sm">
                  {consents.data.map((consent) => (
                    <li key={consent.id} className="flex justify-between gap-3 py-2">
                      <span>{consent.kind === 'terms' ? 'Termos e Condições' : 'Política de Privacidade'} · versão {consent.version}</span>
                      <span className="text-muted-foreground tabular-nums">{consent.accepted_at ? formatDateTime(consent.accepted_at) : '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
          </CardContent>
        </Card>
      </div>

      <SuspendDialog open={suspending} onOpenChange={setSuspending} kind="account" name={data.full_name ?? ''} suspend={suspend} />
      <ConfirmationModal
        open={reactivating}
        onOpenChange={setReactivating}
        title={`Reactivar a conta de ${data.full_name}?`}
        description="A pessoa volta a usar o Portal. O que foi cancelado durante a suspensão não volta."
        confirmLabel="Reactivar"
        variant="info"
        isLoading={reactivate.isPending}
        onConfirm={() => reactivate.mutate(undefined, {
          onSuccess: () => {
            toast.success('Conta reactivada.')
            setReactivating(false)
          },
          onError: (error) => toast.error(errorMessage(error)),
        })}
      />
    </>
  )
}
