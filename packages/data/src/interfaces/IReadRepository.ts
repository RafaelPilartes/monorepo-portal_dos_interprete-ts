import type { ListResponse } from './IApiResponse'

export interface ListQuery<Row> {
  limit?: number | undefined
  offset?: number | undefined
  searchTerm?: string | undefined
  filters?: Partial<Row> | undefined
  orderBy?: (keyof Row & string) | undefined
  ascending?: boolean | undefined
}

/** Port for reads, which go straight to the database under RLS (architecture.md §1). */
export interface IReadRepository<Row> {
  list(query?: ListQuery<Row>): Promise<ListResponse<Row>>
  getById(id: string): Promise<Row | null>
  getOneByField(field: keyof Row & string, value: unknown): Promise<Row | null>
  /** Realtime only where someone is waiting (architecture.md §7). Returns unsubscribe. */
  listenById(id: string, onChange: (row: Row) => void, onError?: (error: Error) => void): () => void
}

/**
 * Port for the simple writes a user makes on their own rows, by column grant
 * (ADR-003). Anything with state, money or another person goes through the API.
 */
export interface IOwnRowsRepository<Row, Insert, Update> extends IReadRepository<Row> {
  create(values: Insert): Promise<Row>
  update(id: string, values: Update): Promise<Row>
}
