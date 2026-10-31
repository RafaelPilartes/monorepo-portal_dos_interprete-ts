import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NOTIFICATION_TEXTS } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { PaginationBar } from '@portal-dos-interpretes/ui/components/pagination-bar'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import type { AppName } from '@portal-dos-interpretes/ui/lib/app-urls'
import { Bell } from 'lucide-react'
import { NotificationItem, notificationKeys, useMarkRead, useNotificationsDAO, useOpenNotification } from '../components/NotificationBell'

const PAGE_SIZE = 20

/** /notifications (notifications.md): all of them, paginated, read or unread. */
export default function Notifications({ app }: { app: AppName }) {
  const dao = useNotificationsDAO()
  const markRead = useMarkRead()
  const open = useOpenNotification(app)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const list = useQuery({
    queryKey: [...notificationKeys.all, 'page', unreadOnly, page],
    queryFn: () => dao.page({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, unreadOnly }),
  })

  return (
    <>
      <PageHeader
        title={NOTIFICATION_TEXTS.pageTitle}
        description="Os avisos sobre os teus pedidos e a tua conta."
        action={<Button variant="outline" disabled={markRead.isPending} onClick={() => markRead.mutate('all')}>{NOTIFICATION_TEXTS.markAllRead}</Button>}
      />
      <div className="mb-4 flex gap-2" role="group" aria-label="Filtro">
        <Button size="sm" variant={unreadOnly ? 'outline' : 'default'} aria-pressed={!unreadOnly} onClick={() => { setUnreadOnly(false); setPage(1) }}>Todas</Button>
        <Button size="sm" variant={unreadOnly ? 'default' : 'outline'} aria-pressed={unreadOnly} onClick={() => { setUnreadOnly(true); setPage(1) }}>Por ler</Button>
      </div>
      {list.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : list.isError ? (
        <p role="alert" className="text-sm text-destructive">Não foi possível carregar as notificações. <button type="button" className="underline" onClick={() => void list.refetch()}>Tentar outra vez</button></p>
      ) : list.data.rows.length === 0 ? (
        <EmptyState icon={Bell} title={NOTIFICATION_TEXTS.empty} description="Quando houver novidades nos teus pedidos, aparecem aqui." />
      ) : (
        <>
          <Card><CardContent className="divide-y p-1">
            {list.data.rows.map((row) => (
              <NotificationItem key={row.id} row={row} onOpen={(item) => {
                if (!item.read_at) markRead.mutate([item.id])
                open(item)
              }} />
            ))}
          </CardContent></Card>
          <div className="mt-4"><PaginationBar page={page} pageCount={Math.max(1, Math.ceil(list.data.total / PAGE_SIZE))} onPageChange={setPage} /></div>
        </>
      )}
    </>
  )
}
