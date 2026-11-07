import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NotificationsDAO, type NotificationRow } from '@portal-dos-interpretes/data'
import { formatDateTime, NOTIFICATION_TEXTS, notificationText } from '@portal-dos-interpretes/i18n'
import { appUrl, type AppName } from '@portal-dos-interpretes/ui/lib/app-urls'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@portal-dos-interpretes/ui/components/popover'
import { Bell } from 'lucide-react'
import { useRequiredPortalServices } from '../services/PortalServices'

// The bell in the panels' top bar (notifications.md): unread count, the 10 most recent, "Marcar
// todas como lidas", "Ver todas". Read every 30 seconds while the page is open (AD-034).

export const notificationKeys = { all: ['notifications'] as const }
const REFRESH_MS = 30_000

export function useNotificationsDAO(): NotificationsDAO {
  const { client } = useRequiredPortalServices()
  return useMemo(() => new NotificationsDAO(client), [client])
}

/** Opens a notice where it belongs: in this app, or in the app its payload names. */
export function useOpenNotification(app: AppName) {
  const navigate = useNavigate()
  return (row: NotificationRow) => {
    const payload = (row.payload ?? {}) as Record<string, unknown>
    const target = typeof payload.app === 'string' ? payload.app : app
    if (!row.link) return
    if (target === app) navigate(row.link)
    else window.location.assign(appUrl(target as AppName, row.link))
  }
}

export function useMarkRead() {
  const dao = useNotificationsDAO()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: readonly string[] | 'all') => dao.markRead(ids),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function NotificationItem({ row, onOpen }: { row: NotificationRow; onOpen: (row: NotificationRow) => void }) {
  const { title, body } = notificationText(row.kind, (row.payload ?? {}) as Record<string, unknown>)
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="flex w-full gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
    >
      <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${row.read_at ? 'bg-transparent' : 'bg-primary'}`} />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${row.read_at ? '' : 'font-medium'}`}>{title}</span>
        {body && <span className="block truncate text-xs text-muted-foreground">{body}</span>}
        <span className="block text-xs text-muted-foreground">{formatDateTime(row.created_at)}</span>
      </span>
    </button>
  )
}

export function NotificationBell({ app }: { app: AppName }) {
  const dao = useNotificationsDAO()
  const markRead = useMarkRead()
  const open = useOpenNotification(app)
  const unread = useQuery({ queryKey: [...notificationKeys.all, 'unread'], queryFn: () => dao.unreadCount(), refetchInterval: REFRESH_MS })
  const recent = useQuery({ queryKey: [...notificationKeys.all, 'recent'], queryFn: () => dao.page({ limit: 10 }), refetchInterval: REFRESH_MS })
  const count = unread.data ?? 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={NOTIFICATION_TEXTS.bellLabel(count)}
          className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">{NOTIFICATION_TEXTS.pageTitle}</p>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={markRead.isPending} onClick={() => markRead.mutate('all')}>
              {NOTIFICATION_TEXTS.markAllRead}
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          {recent.isError ? (
            <p role="alert" className="px-3 py-6 text-center text-sm text-destructive">Não foi possível carregar as notificações.</p>
          ) : (recent.data?.rows.length ?? 0) === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">{recent.isPending ? 'A carregar…' : NOTIFICATION_TEXTS.empty}</p>
          ) : (
            recent.data?.rows.map((row) => (
              <NotificationItem key={row.id} row={row} onOpen={(item) => {
                if (!item.read_at) markRead.mutate([item.id])
                open(item)
              }} />
            ))
          )}
        </div>
        <div className="border-t p-1">
          <Button variant="ghost" size="sm" className="w-full" asChild><Link to="/notifications">{NOTIFICATION_TEXTS.seeAll}</Link></Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
