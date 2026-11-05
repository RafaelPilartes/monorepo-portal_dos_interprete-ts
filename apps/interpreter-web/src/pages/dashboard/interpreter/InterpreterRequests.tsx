import { Link } from 'react-router-dom'
import { QueryError, TableSkeleton } from '@portal-dos-interpretes/features/components/QueryStates'
import type { MyAssignmentRow } from '@portal-dos-interpretes/features/requests/data'
import { priceText } from '@portal-dos-interpretes/features/requests/RequestParts'
import { useMyAssignments } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { formatDateTime, MODALITY_TEXT } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { StatusBadge } from '@portal-dos-interpretes/ui/components/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@portal-dos-interpretes/ui/components/tabs'
import { Inbox } from 'lucide-react'

// interpreter-web /requests (requests-direct.md): "Convites" with the answer deadline in sight,
// "Aceites", "Terminados".

const GROUPS = [
  { value: 'invites', label: 'Convites', statuses: ['invited', 'applied'], empty: 'Não tens convites neste momento.' },
  { value: 'accepted', label: 'Aceites', statuses: ['accepted', 'delivered', 'disputed'], empty: 'Ainda não tens serviços aceites.' },
  { value: 'finished', label: 'Terminados', statuses: ['completed', 'cancelled', 'declined', 'expired', 'not_selected', 'withdrawn'], empty: 'Ainda não há serviços terminados.' },
] as const

function Row({ row }: { row: MyAssignmentRow }) {
  return (
    <li>
      <Link to={`/requests/${row.request_id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-muted/60">
        <div className="min-w-0">
          <p className="font-medium">{row.service_title}{row.is_urgent && <Badge variant="destructive" className="ml-2 py-0 text-[10px]">Urgente</Badge>}</p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(row.starts_at ?? '')} · {MODALITY_TEXT[row.modality as 'online' | 'in_person']}{row.city ? ` · ${row.city}` : ''}
          </p>
          {row.status === 'invited' && row.invite_expires_at && (
            <p className="text-sm font-medium text-warning">Responde até {formatDateTime(row.invite_expires_at)}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-sm">{row.agreed_price_aoa !== null ? priceText(row.agreed_price_aoa, row.agreed_travel_fee_aoa) : priceText(row.offered_price_aoa, row.offered_travel_fee_aoa)}</span>
          <StatusBadge kind="assignment" status={row.status ?? ''} />
        </div>
      </Link>
    </li>
  )
}

export default function InterpreterRequests() {
  const mine = useMyAssignments()
  return (
    <>
      <PageHeader title="Solicitações" description="Os convites que recebeste e os serviços que aceitaste." />
      {mine.isPending ? <TableSkeleton /> : mine.isError ? <QueryError error={mine.error} onRetry={() => void mine.refetch()} /> : (
        <Tabs defaultValue="invites">
          <TabsList>
            {GROUPS.map((group) => {
              const count = mine.data.filter((row) => (group.statuses as readonly string[]).includes(row.status ?? '')).length
              return <TabsTrigger key={group.value} value={group.value}>{group.label}{count > 0 ? ` (${count})` : ''}</TabsTrigger>
            })}
          </TabsList>
          {GROUPS.map((group) => {
            const rows = mine.data.filter((row) => (group.statuses as readonly string[]).includes(row.status ?? ''))
            return (
              <TabsContent key={group.value} value={group.value}>
                <Card><CardContent className="pt-6">
                  {rows.length === 0 ? <EmptyState icon={Inbox} title={group.empty} description="Os pedidos aparecem aqui quando um solicitante te convida." />
                    : <ul className="divide-y">{rows.map((row) => <Row key={row.id} row={row} />)}</ul>}
                </CardContent></Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </>
  )
}
