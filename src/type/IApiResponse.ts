export type paginationType = {
  limit: number | null
  offset: any | null
  count: number
  total?: number | undefined // total de registros na base
} | null

export type ListResponseType<T> = {
  data: T
  message?: string
  pagination?: paginationType
}

export type SingleResponseType<T> = {
  data: T
  message?: string
}
