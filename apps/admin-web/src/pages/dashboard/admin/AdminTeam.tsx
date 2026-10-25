import { useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '@portal-dos-interpretes/auth'
import { COMMON_TEXTS, formatDate, STAFF_LEVEL_LABELS } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { ConfirmationModal } from '@portal-dos-interpretes/ui/components/confirmation-modal'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal-dos-interpretes/ui/components/table'
import { UserPlus } from 'lucide-react'
import { errorDetails, errorMessage } from '@/components/errorText'
import { QueryError, TableSkeleton } from '@/components/QueryStates'
import type { StaffRow } from '@/data/repositories'
import { useStaffList, useStaffMutations, type StaffLevel } from '@/viewModels/staff-config.viewmodel'

// /team (staff-and-config.md): the team, from identity.staff_directory; changes through the API.
// Never empty (there is always a super_admin).

const LEVELS = Object.keys(STAFF_LEVEL_LABELS) as StaffLevel[]

function LevelSelect({ value, onChange, id }: { value: StaffLevel; onChange: (level: StaffLevel) => void; id?: string }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as StaffLevel)}>
      <SelectTrigger id={id} aria-label="Nível">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEVELS.map((level) => (
          <SelectItem key={level} value={level}>{STAFF_LEVEL_LABELS[level]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type PendingChange = { member: StaffRow; level?: StaffLevel; active?: boolean; description: string }

export default function AdminTeam() {
  const session = useSession()
  const isSuper = session.status === 'authenticated' && session.account.staffLevel === 'super_admin'
  const staff = useStaffList()
  const { add, change } = useStaffMutations()
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [level, setLevel] = useState<StaffLevel>('moderator')
  const [addError, setAddError] = useState<unknown>(null)
  const [pending, setPending] = useState<PendingChange | null>(null)

  const submitAdd = async () => {
    setAddError(null)
    try {
      await add.mutateAsync({ email, level })
      toast.success('Membro adicionado à equipa.')
      setAdding(false)
      setEmail('')
    } catch (error) {
      setAddError(error)
    }
  }

  const confirmChange = async () => {
    if (!pending) return
    try {
      await change.mutateAsync({ accountId: pending.member.account_id ?? '', level: pending.level, active: pending.active })
      toast.success('Alteração guardada.')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipa"
        description="Quem gere o Portal e com que nível."
        action={
          isSuper ? (
            <Button onClick={() => setAdding(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar membro
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="pt-6">
          {staff.isPending ? (
            <TableSkeleton />
          ) : staff.isError ? (
            <QueryError error={staff.error} onRetry={() => void staff.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead>Desde</TableHead>
                  {isSuper && <TableHead className="text-right">Acções</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.data.map((member) => {
                  const memberLevel = (member.level ?? 'moderator') as StaffLevel
                  return (
                    <TableRow key={member.account_id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {isSuper ? (
                          <LevelSelect
                            value={memberLevel}
                            onChange={(next) =>
                              next !== memberLevel &&
                              setPending({ member, level: next, description: `Mudar ${member.full_name ?? ''} para ${STAFF_LEVEL_LABELS[next]}?` })
                            }
                          />
                        ) : (
                          STAFF_LEVEL_LABELS[memberLevel]
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.active ? 'default' : 'secondary'}>{member.active ? 'Activo' : 'Inactivo'}</Badge>
                      </TableCell>
                      <TableCell>{member.created_by_name ?? '—'}</TableCell>
                      <TableCell>{member.created_at ? formatDate(member.created_at) : '—'}</TableCell>
                      {isSuper && (
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPending({
                                member,
                                active: !member.active,
                                description: member.active
                                  ? `Desactivar ${member.full_name ?? ''}? Deixa de ter acesso à área da equipa.`
                                  : `Reactivar ${member.full_name ?? ''}?`,
                              })
                            }
                          >
                            {member.active ? 'Desactivar' : 'Reactivar'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={adding} onOpenChange={(open) => { setAdding(open); setAddError(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membro</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void submitAdd()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email da conta</Label>
              <Input id="staff-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              <p className="text-xs text-muted-foreground">A pessoa tem de ter uma conta registada no Portal.</p>
              {errorDetails(addError).email && <p className="text-sm text-destructive">{errorDetails(addError).email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-level">Nível</Label>
              <LevelSelect id="staff-level" value={level} onChange={setLevel} />
            </div>
            {addError !== null && <p role="alert" className="text-sm text-destructive">{errorMessage(addError)}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>{COMMON_TEXTS.cancel}</Button>
              <Button type="submit" disabled={add.isPending}>{add.isPending ? COMMON_TEXTS.loading : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Confirmar alteração"
        description={pending?.description ?? ''}
        onConfirm={() => void confirmChange()}
      />
    </div>
  )
}
