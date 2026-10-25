import type { SupabaseClient } from '@supabase/supabase-js'
import type { ListResponse } from '../../interfaces/IApiResponse'
import type { IReadRepository, ListQuery } from '../../interfaces/IReadRepository'
import { DataError } from '../../domain/errors/DataError'
import { translatePostgrestError } from '../../domain/errors/translatePostgrestError'

/** PostgREST "no rows" for .single(). */
const NO_ROWS = 'PGRST116'

/**
 * Reads one table or view of one schema (multi-schema, architecture.md §5).
 * Rows come back as the database shapes them; hydration to entities is the
 * use case's job, not the DAO's.
 */
export class ReadOnlyDAO<Row extends { id: string }> implements IReadRepository<Row> {
  constructor(
    protected readonly client: SupabaseClient,
    protected readonly schemaName: string,
    protected readonly tableName: string,
    protected readonly searchColumns: readonly string[] = [],
  ) {}

  protected get where(): string {
    return `${this.schemaName}.${this.tableName}`
  }

  protected table() {
    return this.client.schema(this.schemaName).from(this.tableName)
  }

  async list(query: ListQuery<Row> = {}): Promise<ListResponse<Row>> {
    const { limit, offset = 0, searchTerm, filters, orderBy, ascending = true } = query
    let request = this.table().select('*', { count: 'exact' })
    if (filters) {
      for (const [column, value] of Object.entries(filters)) {
        if (value !== undefined) request = request.eq(column, value)
      }
    }
    const term = searchTerm?.trim()
    if (term && this.searchColumns.length > 0) {
      // Commas and parentheses would break the or() syntax; they are not useful in a search.
      const safe = term.replace(/[,()]/g, ' ')
      request = request.or(this.searchColumns.map((column) => `${column}.ilike.%${safe}%`).join(','))
    }
    if (orderBy) request = request.order(orderBy, { ascending })
    if (limit !== undefined) request = request.range(offset, offset + limit - 1)

    const { data, error, count } = await request
    if (error) throw translatePostgrestError(error, this.where)
    const rows = (data ?? []) as Row[]
    return { data: rows, pagination: { limit: limit ?? null, offset, count: rows.length, total: count ?? undefined } }
  }

  async getById(id: string): Promise<Row | null> {
    const { data, error } = await this.table().select('*').eq('id', id).single()
    if (error) {
      if (error.code === NO_ROWS) return null
      throw translatePostgrestError(error, this.where)
    }
    return data as Row
  }

  async getOneByField(field: keyof Row & string, value: unknown): Promise<Row | null> {
    const column: string = field
    const { data, error } = await this.table().select('*').eq(column, value).maybeSingle()
    if (error) throw translatePostgrestError(error, this.where)
    return (data as Row | null) ?? null
  }

  listenById(id: string, onChange: (row: Row) => void, onError?: (error: Error) => void): () => void {
    const channel = this.client
      .channel(`${this.where}:id=${id}`)
      .on('postgres_changes', { event: '*', schema: this.schemaName, table: this.tableName, filter: `id=eq.${id}` }, (payload) => {
        if (payload.new && Object.keys(payload.new).length > 0) onChange(payload.new as Row)
      })
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' && onError) onError(error ?? new DataError('INTERNAL_ERROR'))
      })
    return () => {
      void this.client.removeChannel(channel)
    }
  }
}
