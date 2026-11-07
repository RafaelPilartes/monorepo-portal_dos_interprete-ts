import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import type { OpenRequestRow } from '@portal-dos-interpretes/features/requests/data'
import { durationText, priceText } from '@portal-dos-interpretes/features/requests/RequestParts'
import { useRequestAction, useRequests } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatDateTime, luandaDay, MODALITY_TEXT } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { Inbox } from 'lucide-react'

// interpreter-web /open-requests (requests-open.md, R-OPN-01): the open requests for me, with the
// value I would earn — the budget in "first to accept", my own price in "I choose" — and
// "Aceitar" or "Candidatar-me". Read every 20 seconds: a request that fills up leaves the list.

const ALL = 'all'

function OpenRequest({ row, onApply }: { row: OpenRequestRow; onApply: (row: OpenRequestRow) => void }) {
  const accept = useRequestAction((repository, id: string) => repository.acceptOpen(id), 'Pedido aceite. O lugar é teu.')
  const firstAccept = row.open_mode === 'first_accept'
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{row.service_title}{row.is_urgent && <Badge variant="destructive" className="ml-2 py-0 text-[10px]">Urgente</Badge>}</p>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(row.starts_at ?? '')} · {durationText(row.duration_minutes ?? 0)} · {row.modality === 'online' ? 'Online' : row.city ?? MODALITY_TEXT.in_person}
        </p>
        <p className="text-sm text-muted-foreground">{(row.language_names ?? []).join(', ')} · {firstAccept ? 'O primeiro que aceitar' : 'O solicitante escolhe'} · {row.accepted_count} de {row.interpreters_needed} lugares ocupados</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-semibold tabular-nums">{priceText(row.value_aoa, row.travel_fee_aoa)}</p>
          <p className="text-xs text-muted-foreground">{firstAccept ? 'tudo incluído' : 'o teu preço'}</p>
        </div>
        {firstAccept
          ? <Button disabled={accept.isPending} onClick={() => accept.mutate(row.id ?? '')}>Aceitar</Button>
          : <Button variant="outline" onClick={() => onApply(row)}>Candidatar-me</Button>}
      </div>
    </li>
  )
}

export default function InterpreterOpenRequests() {
  const { repository } = useRequests()
  const list = useQuery({ queryKey: ['requests', 'open-for-me'], queryFn: () => repository.openForMe(), refetchInterval: 20_000 })
  const [modality, setModality] = useState(ALL)
  const [city, setCity] = useState('')
  const [day, setDay] = useState('')
  const [applying, setApplying] = useState<OpenRequestRow | null>(null)
  const [message, setMessage] = useState('')
  const apply = useRequestAction((repo, input: { id: string; message: string }) => repo.apply(input.id, input.message), 'Candidatura enviada. O solicitante foi avisado.')

  const rows = (list.data ?? []).filter((row) =>
    (modality === ALL || row.modality === modality)
    && (!city.trim() || (row.city ?? '').toLowerCase().includes(city.trim().toLowerCase()))
    && (!day || luandaDay(row.starts_at ?? '') === day))

  return (
    <>
      <PageHeader title="Solicitações Abertas" description="Pedidos publicados para intérpretes como tu." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={modality} onValueChange={setModality}>
          <SelectTrigger className="w-44" aria-label="Modalidade"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Presencial e online</SelectItem>
            <SelectItem value="in_person">Presencial</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
        <Input aria-label="Cidade" placeholder="Cidade" className="w-44" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input aria-label="Dia" type="date" className="w-44" value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      <Card><CardContent className="p-0">
        {list.isPending ? <div className="p-6"><TableSkeleton /></div>
          : list.isError ? <div className="p-6"><QueryError error={list.error} onRetry={() => void list.refetch()} /></div>
          : rows.length === 0 ? (
            <EmptyState icon={Inbox} title="Não há pedidos abertos para ti neste momento."
              description="Completar o perfil e acrescentar línguas e serviços aumenta os pedidos que vês."
              action={<Button variant="outline" asChild><Link to="/profile/services">Línguas e serviços</Link></Button>} />
          ) : <ul className="divide-y">{rows.map((row) => <OpenRequest key={row.id} row={row} onApply={setApplying} />)}</ul>}
      </CardContent></Card>

      <Dialog open={applying !== null} onOpenChange={(open) => { if (!open) { setApplying(null); setMessage('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidatar-me</DialogTitle>
            <DialogDescription>
              {applying && `${applying.service_title}, ${formatDateTime(applying.starts_at ?? '')}. O teu preço: ${priceText(applying.value_aoa, applying.travel_fee_aoa)}.`}
              {' '}A candidatura é uma oferta firme até a retirares.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="application-message">Mensagem para o solicitante (opcional)</Label>
            <Textarea id="application-message" rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplying(null)}>Cancelar</Button>
            <Button disabled={apply.isPending} onClick={() => applying && apply.mutate({ id: applying.id ?? '', message: message.trim() },
              { onSuccess: () => { setApplying(null); setMessage('') } })}>Enviar candidatura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
