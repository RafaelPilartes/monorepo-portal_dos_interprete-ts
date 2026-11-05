import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ASSIGNMENT_STATUS_LABELS, formatAoa, formatDateTime, MODALITY_TEXT, REQUEST_STATUS_LABELS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { CalendarClock, Clock, Languages, Link2, MapPin, Send, User } from 'lucide-react'
import { DataError } from '@portal-dos-interpretes/data'
import { errorMessage } from '../lib/errorText'
import type { ProposalRow, RequestRow, TimelineRow } from './data'
import { requestKeys, useRequests } from './RequestsContext'

// Pieces of /requests/:id shared by requester-web and interpreter-web (requests-core.md).

/** "3 h 30 min", "45 min". */
export function durationText(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return [hours ? `${hours} h` : '', rest ? `${rest} min` : ''].filter(Boolean).join(' ')
}

/** The facts of a request. Times in Luanda, marked as such (requests-core.md, "Fuso horário"). */
export function RequestFacts({ request }: { request: RequestRow }) {
  const rows = [
    { icon: CalendarClock, label: 'Quando', value: `${formatDateTime(request.starts_at ?? '')} (hora de Luanda)` },
    { icon: Clock, label: 'Duração', value: durationText(request.duration_minutes ?? 0) },
    { icon: Languages, label: 'Línguas', value: (request.language_names ?? []).join(', ') },
    { icon: MapPin, label: MODALITY_TEXT[request.modality as 'online' | 'in_person'] ?? '', value: request.modality === 'online'
      ? (request.meeting_link ?? 'Link por indicar') : [request.address, request.city].filter(Boolean).join(', ') || request.city || 'Morada visível depois de aceitar' },
    ...(request.beneficiary_name ? [{ icon: User, label: 'Para quem', value: [request.beneficiary_name, request.beneficiary_contact].filter(Boolean).join(' · ') }] : []),
  ]
  return (
    <Card>
      <CardHeader><CardTitle>{request.service_title}</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="break-words">{label === 'Online' && request.meeting_link
                  ? <a href={request.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Link2 className="h-3 w-3" />{request.meeting_link}</a>
                  : value}</dd>
              </div>
            </div>
          ))}
        </dl>
        {request.notes && <p className="rounded-md bg-muted/50 p-3 text-muted-foreground">{request.notes}</p>}
      </CardContent>
    </Card>
  )
}

/** "12 000 Kz + 1 500 Kz de deslocação" — both values come from the database. */
export function priceText(price: number | null, travel: number | null): string {
  if (price === null) return '—'
  return travel ? `${formatAoa(price)} + ${formatAoa(travel)} de deslocação` : formatAoa(price)
}

/** The request log as a timeline (R-REQ-11). */
export function RequestTimeline({ rows }: { rows: readonly TimelineRow[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
      <CardContent>
        <ol className="space-y-3 border-l pl-4 text-sm">
          {rows.map((row) => {
            const label = row.assignment_id
              ? `${row.interpreter_name ?? 'Intérprete'}: ${ASSIGNMENT_STATUS_LABELS[row.to_status as keyof typeof ASSIGNMENT_STATUS_LABELS] ?? row.to_status}`
              : REQUEST_STATUS_LABELS[row.to_status as keyof typeof REQUEST_STATUS_LABELS] ?? row.to_status
            return (
              <li key={row.id} className="relative">
                <span aria-hidden="true" className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(row.at ?? '')}{row.reason ? ` · ${row.reason}` : ''}</p>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

/** What the chat needs to negotiate the price of an assignment (negotiation.md). */
export interface Negotiation {
  /** Who the viewer is in this thread. */
  role: 'requester' | 'interpreter'
  /** The assignment's status: proposals only while invited or applied (R-NEG-01). */
  assignmentStatus: string
  /** The price offered in force and the travel fee (not negotiated, R-NEG-05). */
  offeredPrice: number | null
  travelFee: number | null
  /** R-NEG-04: the requester may not propose to an interpreter who does not negotiate. */
  interpreterNegotiates: boolean
}

const PROPOSAL_STATUS: Readonly<Record<string, string>> = {
  open: 'À espera de resposta', accepted: 'Aceite', rejected: 'Recusada', void: 'Substituída por uma nova proposta',
}

function ProposalCard({ proposal, mine, canAnswer, onAnswer, busy, travelFee }: {
  proposal: ProposalRow; mine: boolean; canAnswer: boolean; busy: boolean; travelFee: number | null
  onAnswer: (accept: boolean) => void
}) {
  const voided = proposal.status === 'void'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="w-full max-w-[85%] rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
        <p className="text-xs text-muted-foreground">{mine ? 'A tua proposta' : `Proposta de ${proposal.proposed_by_name ?? ''}`}</p>
        <p className={`font-semibold ${voided ? 'text-muted-foreground line-through' : ''}`}>
          Proposta: {formatAoa(proposal.amount_aoa ?? 0)}
          {proposal.previous_amount_aoa !== null && <span className="font-normal text-muted-foreground"> (era {formatAoa(proposal.previous_amount_aoa)})</span>}
          {travelFee ? <span className="font-normal text-muted-foreground"> + deslocação {formatAoa(travelFee)}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">{PROPOSAL_STATUS[proposal.status ?? ''] ?? proposal.status} · {formatDateTime(proposal.created_at ?? '')}</p>
        {canAnswer && proposal.status === 'open' && !mine && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => onAnswer(true)}>Aceitar</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onAnswer(false)}>Recusar</Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * The chat of one thread (R-REQ-08): messages and price proposals every 10 seconds while open
 * (AD-034), the composer for participants, read marks. A closed thread is read, never written
 * (the database refuses). With `negotiation`, "Propor outro preço" while it may be negotiated.
 */
export function RequestChat({ threadId, title, negotiation }: { threadId: string; title: string; negotiation?: Negotiation | undefined }) {
  const { repository, accountId } = useRequests()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposing, setProposing] = useState(false)
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const messages = useQuery({ queryKey: requestKeys.messages(threadId), queryFn: () => repository.messages(threadId), refetchInterval: 10_000 })
  const proposals = useQuery({ queryKey: [...requestKeys.messages(threadId), 'proposals'], queryFn: () => repository.proposals(threadId), refetchInterval: 10_000 })
  const count = (messages.data?.length ?? 0) + (proposals.data?.length ?? 0)
  const refresh = () => queryClient.invalidateQueries({ queryKey: requestKeys.all })
  const answer = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => repository.answerProposal(id, accept),
    onSuccess: (_result, input) => toast.success(input.accept ? 'Proposta aceite: é o novo preço proposto.' : 'Proposta recusada.'),
    onError: (failure) => toast.error(errorMessage(failure)),
    onSettled: refresh,
  })
  const propose = useMutation({
    mutationFn: (value: number) => repository.propose(threadId, value),
    onSuccess: () => { toast.success('Proposta enviada.'); setProposing(false); setAmount(''); setAmountError(null) },
    // INVALID_AMOUNT belongs to the field; anything else (NEGOTIATION_CLOSED…) is a toast.
    onError: (failure) => {
      if (failure instanceof DataError && failure.field === 'amount_aoa') setAmountError(failure.message)
      else toast.error(errorMessage(failure))
    },
    onSettled: refresh,
  })

  // R-NEG-01, R-NEG-04: the button only where a proposal may be made.
  const negotiating = negotiation !== undefined && ['invited', 'applied'].includes(negotiation.assignmentStatus)
  const mayPropose = negotiating && (negotiation.role === 'interpreter' || negotiation.interpreterNegotiates)

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
    // A read mark that fails only leaves the thread counted as unread; it is logged, not hidden.
    if (count > 0) void repository.markThreadRead(threadId, accountId).catch((failure: unknown) => console.error('[chat] read mark failed', failure))
  }, [count, threadId, accountId, repository])

  const send = async () => {
    const text = body.trim()
    if (!text) return
    setSending(true)
    setError(null)
    try {
      await repository.send(threadId, accountId, text)
      setBody('')
      await queryClient.invalidateQueries({ queryKey: requestKeys.messages(threadId) })
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setSending(false)
    }
  }

  // Messages and proposals in the order they happened.
  const items = [
    ...(messages.data ?? []).map((message) => ({ at: message.created_at, message, proposal: null })),
    ...(proposals.data ?? []).map((proposal) => ({ at: proposal.created_at ?? '', message: null, proposal })),
  ].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3" aria-live="polite">
          {messages.isPending ? <p className="text-sm text-muted-foreground">A carregar…</p>
            : messages.isError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar as mensagens.</p>
            : items.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há mensagens. Escreve a primeira.</p>
            : items.map(({ message, proposal }) => {
              if (proposal) {
                return (
                  <ProposalCard key={proposal.id} proposal={proposal} mine={proposal.proposed_by === accountId} canAnswer={negotiating}
                    busy={answer.isPending} travelFee={negotiation?.travelFee ?? null}
                    onAnswer={(accept) => answer.mutate({ id: proposal.id ?? '', accept })} />
                )
              }
              if (!message) return null
              const mine = message.sender_account === accountId
              return (
                <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                    <p className="whitespace-pre-line break-words">{message.body}</p>
                    <p className={`mt-1 text-[11px] ${mine ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{formatDateTime(message.created_at)}</p>
                  </div>
                </div>
              )
            })}
          <div ref={end} />
        </div>
        {negotiation && (
          !negotiating ? <p className="text-xs text-muted-foreground">A negociação está fechada.</p>
            : !mayPropose ? <p className="text-xs text-muted-foreground">Este intérprete não aceita negociar o preço.</p>
            : proposing ? (
              <form className="flex flex-wrap items-end gap-2 rounded-md border p-3" onSubmit={(event) => { event.preventDefault(); propose.mutate(Number(amount.replace(/[\s.]/g, ''))) }}>
                <div className="space-y-1">
                  <Label htmlFor={`proposal-${threadId}`}>Novo valor, em kwanzas, sem a deslocação</Label>
                  <Input id={`proposal-${threadId}`} type="number" inputMode="numeric" className="w-44" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!amountError} />
                  <p className="text-xs text-muted-foreground">Preço actual: {negotiation.offeredPrice !== null ? formatAoa(negotiation.offeredPrice) : '—'}{negotiation.travelFee ? ` + deslocação ${formatAoa(negotiation.travelFee)}` : ''}</p>
                  {amountError && <p className="text-sm text-destructive">{amountError}</p>}
                </div>
                <Button type="submit" size="sm" disabled={propose.isPending || amount.trim() === ''}>Enviar proposta</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setProposing(false); setAmountError(null) }}>Cancelar</Button>
              </form>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setProposing(true)}>Propor outro preço</Button>
            )
        )}
        <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); void send() }}>
          <Textarea
            aria-label="Mensagem"
            rows={2}
            value={body}
            maxLength={4000}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }}
            placeholder="Escreve uma mensagem"
          />
          <Button type="submit" size="icon" aria-label="Enviar" disabled={sending || !body.trim()}><Send className="h-4 w-4" /></Button>
        </form>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
