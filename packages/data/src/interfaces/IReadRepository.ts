import type { ListResponse } from './IApiResponse'

export interface ListQuery<Row> {
  limit?: number | undefined
  offset?: number | undefined
  searchTerm?: string | undefined
  filters?: Partial<Row> | undefined
  orderBy?: (keyof Row & string) | undefined
  ascending?: boolean | undefined
  /** A column between two values, both ends included (e.g. a period of dates). */
  between?: { column: keyof Row & string; from?: string | undefined; to?: string | undefined } | undefined
}

/** Port for reads, which go straight to the database under RLS (architecture.md §1). */
export interface IReadRepository<Row> {
  list(query?: ListQuery<Row>): Promise<ListResponse<Row>>
  getById(id: string): Promise<Row | null>
  getOneByField(field: keyof Row & string, value: unknown): Promise<Row | null>
  /**
   * Realtime only where someone is waiting (architecture.md §7). A deleted row
   * calls onDelete; a channel that fails or times out calls onError. Returns unsubscribe.
   */
  listenById(id: string, handlers: { onChange: (row: Row) => void; onDelete: () => void; onError: (error: Error) => void }): () => void
}

/**
 * Port for the simple writes a user makes on their own rows, by column grant
 * (ADR-003). Anything with state, money or another person goes through the API.
 */
export interface IOwnRowsRepository<Row, Insert, Update> extends IReadRepository<Row> {
  create(values: Insert): Promise<Row>
  update(id: string, values: Update): Promise<Row>
}
