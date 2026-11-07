import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tables } from '@portal-dos-interpretes/db-types'
import { translatePostgrestError } from '../../domain/errors/translatePostgrestError'

export type NotificationRow = Tables<{ schema: 'notify' }, 'notifications'>

/**
 * The signed-in account's notices (notifications.md, R-NOT-05): RLS gives only its own rows; the
 * only column it writes is read_at. The notices themselves are written by notify.enqueue only.
 */
export class NotificationsDAO {
  constructor(private readonly client: SupabaseClient) {}

  private table() {
    return this.client.schema('notify').from('notifications')
  }

  async page(options: { limit: number; offset?: number; unreadOnly?: boolean }): Promise<{ rows: NotificationRow[]; total: number }> {
    const offset = options.offset ?? 0
    let request = this.table().select('*', { count: 'exact' })
    if (options.unreadOnly) request = request.is('read_at', null)
    const { data, error, count } = await request.order('created_at', { ascending: false }).range(offset, offset + options.limit - 1)
    if (error) throw translatePostgrestError(error, 'notify.notifications')
    return { rows: (data ?? []) as NotificationRow[], total: count ?? 0 }
  }

  async unreadCount(): Promise<number> {
    const { error, count } = await this.table().select('id', { count: 'exact', head: true }).is('read_at', null)
    if (error) throw translatePostgrestError(error, 'notify.notifications')
    return count ?? 0
  }

  async markRead(ids: readonly string[] | 'all'): Promise<void> {
    let request = this.table().update({ read_at: new Date().toISOString() }).is('read_at', null)
    if (ids !== 'all') request = request.in('id', [...ids])
    const { error } = await request
    if (error) throw translatePostgrestError(error, 'notify.notifications')
  }
}
