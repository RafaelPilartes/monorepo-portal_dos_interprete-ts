export interface Pagination {
  limit: number | null
  offset: number
  /** Rows in this page. */
  count: number
  /** Rows matching the query, when the backend reports it. */
  total?: number | undefined
}

export interface ListResponse<T> {
  data: T[]
  pagination: Pagination
}
