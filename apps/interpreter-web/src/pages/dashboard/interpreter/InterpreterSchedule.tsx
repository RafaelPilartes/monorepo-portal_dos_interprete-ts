import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import type { MyAssignmentRow } from '@portal-dos-interpretes/features/requests/data'
import { durationText } from '@portal-dos-interpretes/features/requests/RequestParts'
import { useMyAssignments } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatDate, formatTime, luandaDay, MODALITY_TEXT } from '@portal-dos-interpretes/i18n'
import { AgendaItem, AgendaList } from '@portal-dos-interpretes/ui/components/agenda'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Calendar } from '@portal-dos-interpretes/ui/components/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { CheckCircle2, Clock, MapPin, Video } from 'lucide-react'

// interpreter-web /schedule (service-lifecycle.md "Ecrãs"): the accepted services in a calendar
// and a list, with the ones waiting to be marked as done first. Days are Luanda days.

const ON_SCHEDULE = ['accepted', 'delivered', 'disputed']

function ServiceLine({ row }: { row: MyAssignmentRow }) {
  const Icon = row.modality === 'online' ? Video : MapPin
  return (
    <AgendaItem at={row.starts_at} aside={<>
      <StatusBadge kind="assignment" status={row.status ?? ''} />
      <Button variant="outline" size="sm" asChild><Link to={`/requests/${row.request_id}`}>Ver pedido</Link></Button>
    </>}>
      <p className="font-medium">{row.service_title}</p>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {durationText(row.duration_minutes)} · {MODALITY_TEXT[row.modality as keyof typeof MODALITY_TEXT]}{row.city ? ` · ${row.city}` : ''} · <span className="font-mono text-xs">{row.code}</span>
      </p>
    </AgendaItem>
  )
}

export default function InterpreterSchedule() {
  const mine = useMyAssignments()
  const [day, setDay] = useState<Date | undefined>(new Date())

  if (mine.isPending) return <Skeleton className="h-96 w-full" />
  if (mine.isError) return <QueryError error={mine.error} onRetry={() => void mine.refetch()} />

  const now = Date.now()
  const services = (mine.data ?? []).filter((row) => ON_SCHEDULE.includes(row.status ?? ''))
  const toMark = services.filter((row) => row.status === 'accepted' && Date.parse(row.ends_at ?? '') <= now)
  const upcoming = services.filter((row) => Date.parse(row.ends_at ?? '') > now)
  const days = new Set(services.map((row) => luandaDay(row.starts_at ?? '')))
  const onDay = day ? services.filter((row) => luandaDay(row.starts_at ?? '') === luandaDay(day)) : []

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" description="Os serviços que aceitaste, por dia." />

      {toMark.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-warning" aria-hidden="true" />Por marcar como feitos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Estes serviços já terminaram. Marca-os como feitos para o solicitante confirmar.</p>
            <AgendaList label="Por marcar como feitos">{toMark.map((row) => <ServiceLine key={row.id} row={row} />)}</AgendaList>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Calendário</CardTitle></CardHeader>
          <CardContent>
            <Calendar mode="single" selected={day} onSelect={setDay} className="rounded-md border"
              modifiers={{ hasService: (date) => days.has(luandaDay(date)) }}
              modifiersClassNames={{ hasService: 'bg-primary/10 font-semibold' }} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{day ? formatDate(day) : 'Escolhe um dia'}</CardTitle></CardHeader>
          <CardContent>
            {onDay.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Clock className="mx-auto mb-3 h-10 w-10 opacity-50" aria-hidden="true" />
                <p>Nenhum serviço neste dia.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {onDay.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                    <span><span className="font-medium tabular-nums">{formatTime(row.starts_at ?? '')}</span> {row.service_title}</span>
                    <Button variant="ghost" size="sm" asChild><Link to={`/requests/${row.request_id}`}>Abrir</Link></Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Próximos serviços</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0
            ? <p className="text-sm text-muted-foreground">Ainda não tens serviços marcados. Os pedidos que aceitares aparecem aqui.</p>
            : <AgendaList label="Próximos serviços">{upcoming.map((row) => <ServiceLine key={row.id} row={row} />)}</AgendaList>}
        </CardContent>
      </Card>
    </div>
  )
}
