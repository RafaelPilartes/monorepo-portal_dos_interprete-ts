import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession, type OrgRole } from '@portal-dos-interpretes/auth'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import { errorDetails, errorMessage } from '@portal-dos-interpretes/features/lib/errorText'
import { formatDate, ORG_ROLE_LABELS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { ConfirmationModal } from '@portal-dos-interpretes/ui/components/confirmation-modal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@portal-dos-interpretes/ui/components/dropdown-menu'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { MemberRow } from '@/data/repositories'
import { useCurrentOrganization, useInvites, useMembers, useOrganizationMutations } from '@/viewModels/organization.viewmodel'

// /organization/members (accounts-and-organizations.md): members with the actions R-ORG-03 and
// R-ORG-04 allow, pending invites (owner/admin) and the invite form (R-ORG-02). The API refuses
// what the screen does not offer; the screen only avoids offering it.

type Pending =
  | { kind: 'remove'; member: MemberRow }
  | { kind: 'leave'; member: MemberRow }
  | { kind: 'transfer'; member: MemberRow }

function InviteForm({ organizationId }: { organizationId: string }) {
  const { invite } = useOrganizationMutations(organizationId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const errors = invite.isError ? errorDetails(invite.error) : {}
  const submit = (event: FormEvent) => {
    event.preventDefault()
    invite.mutate({ email: email.trim(), role }, {
      onSuccess: () => {
        toast.success(`Convite enviado para ${email.trim()}.`)
        setEmail('')
        invite.reset()
      },
      onError: (error) => {
        if (Object.keys(errorDetails(error)).length === 0) toast.error(errorMessage(error))
      },
    })
  }
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-start">
      <div className="space-y-1.5">
        <Label htmlFor="invite-email" className="sr-only">Email</Label>
        <Input id="invite-email" type="email" placeholder="email@empresa.ao" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={!!errors.email} required />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>
      <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'member')}>
        <SelectTrigger aria-label="Papel"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="member">{ORG_ROLE_LABELS.member}</SelectItem>
          <SelectItem value="admin">{ORG_ROLE_LABELS.admin}</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={invite.isPending || !email.trim()}>{invite.isPending ? 'A enviar…' : 'Convidar'}</Button>
    </form>
  )
}

function Invites({ organizationId }: { organizationId: string }) {
  const invites = useInvites(organizationId, true)
  const { revoke } = useOrganizationMutations(organizationId)
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Convites</CardTitle>
        <CardDescription>Quem recebe o convite entra com o email para onde foi enviado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <InviteForm organizationId={organizationId} />
        {invites.isPending ? (
          <TableSkeleton rows={2} />
        ) : invites.isError ? (
          <QueryError error={invites.error} onRetry={() => void invites.refetch()} />
        ) : invites.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não convidaste ninguém.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Email</TableHead><TableHead>Papel</TableHead><TableHead>Expira em</TableHead><TableHead className="text-right"><span className="sr-only">Acções</span></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {invites.data.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>{ORG_ROLE_LABELS[invite.role as OrgRole] ?? invite.role}</TableCell>
                  <TableCell>{formatDate(invite.expires_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(invite.id, {
                        onSuccess: () => toast.success('Convite revogado.'),
                        onError: (error) => toast.error(errorMessage(error)),
                      })}
                    >
                      Revogar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default function OrganizationMembers() {
  const current = useCurrentOrganization()
  const session = useSession()
  const navigate = useNavigate()
  const me = session.status === 'authenticated' ? session.account.id : null
  const organizationId = current?.id ?? ''
  const members = useMembers(organizationId)
  const mutations = useOrganizationMutations(organizationId)
  const [pending, setPending] = useState<Pending | null>(null)

  if (!current) {
    return (
      <>
        <PageHeader title="Membros" />
        <p className="text-sm text-muted-foreground">Ainda não fazes parte de nenhuma organização. <Link to="/organization" className="text-primary hover:underline">Ver como criar uma</Link>.</p>
      </>
    )
  }
  const myRole = current.role
  const isAdmin = myRole === 'owner' || myRole === 'admin'

  const confirm = () => {
    if (!pending) return
    const done = (message: string) => ({
      onSuccess: () => {
        toast.success(message)
        setPending(null)
        if (pending.kind === 'leave') navigate('/', { replace: true })
      },
      onError: (error: unknown) => {
        toast.error(errorMessage(error))
        setPending(null)
      },
    })
    const accountId = pending.member.account_id ?? ''
    if (pending.kind === 'transfer') mutations.transfer.mutate(accountId, done(`${pending.member.full_name} é agora o dono da organização.`))
    else mutations.remove.mutate(accountId, done(pending.kind === 'leave' ? 'Saíste da organização.' : `Removemos ${pending.member.full_name} da organização.`))
  }

  const dialog = pending && {
    remove: { title: `Remover ${pending.member.full_name}?`, description: 'Deixa de ver os pedidos da organização. Os pedidos que criou continuam a ser da organização.', label: 'Remover', variant: 'danger' as const },
    leave: { title: 'Sair da organização?', description: 'Deixas de ver os pedidos da organização. Os pedidos que criaste continuam a ser dela, acompanhados pelos responsáveis.', label: 'Sair', variant: 'danger' as const },
    transfer: { title: `Passar a posse a ${pending.member.full_name}?`, description: 'Passas a administrador. Só o novo dono muda papéis e pode voltar a transferir a posse.', label: 'Transferir', variant: 'warning' as const },
  }[pending.kind]

  return (
    <>
      <PageHeader title="Membros" description={`${current.name} · todos os membros veem todos os pedidos da organização.`} />
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            {members.isPending ? (
              <TableSkeleton rows={4} />
            ) : members.isError ? (
              <QueryError error={members.error} onRetry={() => void members.refetch()} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Papel</TableHead><TableHead>Desde</TableHead><TableHead className="text-right"><span className="sr-only">Acções</span></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {members.data.map((member) => {
                    const isMe = member.account_id === me
                    const role = member.role as OrgRole
                    const canChangeRole = myRole === 'owner' && role !== 'owner'
                    const canRemove = isAdmin && role !== 'owner' && !isMe
                    const canLeave = isMe && role !== 'owner'
                    return (
                      <TableRow key={member.account_id}>
                        <TableCell className="font-medium">{member.full_name}{isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tu)</span>}</TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          {canChangeRole ? (
                            <Select
                              value={role}
                              disabled={mutations.setRole.isPending}
                              onValueChange={(value) => mutations.setRole.mutate(
                                { accountId: member.account_id ?? '', role: value as 'admin' | 'member' },
                                { onSuccess: () => toast.success('Papel alterado.'), onError: (error) => toast.error(errorMessage(error)) },
                              )}
                            >
                              <SelectTrigger className="h-8 w-36" aria-label={`Papel de ${member.full_name}`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">{ORG_ROLE_LABELS.admin}</SelectItem>
                                <SelectItem value="member">{ORG_ROLE_LABELS.member}</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={role === 'owner' ? 'default' : 'secondary'}>{ORG_ROLE_LABELS[role] ?? role}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{member.joined_at ? formatDate(member.joined_at) : '—'}</TableCell>
                        <TableCell className="text-right">
                          {(canRemove || canLeave || canChangeRole) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Acções para ${member.full_name}`}><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canChangeRole && <DropdownMenuItem onSelect={() => setPending({ kind: 'transfer', member })}>Passar a posse</DropdownMenuItem>}
                                {canRemove && <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setPending({ kind: 'remove', member })}>Remover da organização</DropdownMenuItem>}
                                {canLeave && <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setPending({ kind: 'leave', member })}>Sair da organização</DropdownMenuItem>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {isAdmin && <Invites organizationId={organizationId} />}
      </div>
      {dialog && (
        <ConfirmationModal
          open
          onOpenChange={(open) => !open && setPending(null)}
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.label}
          variant={dialog.variant}
          isLoading={mutations.remove.isPending || mutations.transfer.isPending}
          onConfirm={confirm}
        />
      )}
    </>
  )
}
