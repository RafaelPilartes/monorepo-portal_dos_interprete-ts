import { supabase } from '@/config/supabase'
import { ListResponseType } from '@/type/IApiResponse'
import { IBaseRepository } from '@/core/interfaces/IBaseRepository'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export abstract class BaseSupabaseDAO<
  T extends { id: string }
> implements IBaseRepository<T> {
  constructor(
    protected readonly tableName: string,
    protected readonly searchColumns: string[] = [],
    protected readonly selectQuery: string = '*'
  ) {}

  protected abstract mapToEntity(data: any): T

  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<T>
  ): Promise<ListResponseType<T[]>> {
    let query = supabase.from(this.tableName).select(this.selectQuery, { count: 'exact' })

    if (limit !== undefined)
      query = query.range(offset || 0, (offset || 0) + limit - 1)

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) query = query.eq(key, value)
      })
    }

    if (searchTerm && this.searchColumns.length > 0) {
      const orFilter = this.searchColumns
        .map(col => `${col}.ilike.%${searchTerm}%`)
        .join(',')
      query = query.or(orFilter)
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    const entities = data.map(item => this.mapToEntity(item))

    return {
      data: entities,
      pagination: {
        limit: limit || null,
        offset: offset || 0,
        count: entities.length,
        total: count || undefined
      }
    }
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }

    return this.mapToEntity(data)
  }

  async getAllByField(
    field: keyof T,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<T[]>> {
    let query = supabase
      .from(this.tableName)
      .select(this.selectQuery, { count: 'exact' })
      .eq(field as string, value)

    if (limit !== undefined)
      query = query.range(offset || 0, (offset || 0) + limit - 1)

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    const entities = data.map(item => this.mapToEntity(item))

    return {
      data: entities,
      pagination: {
        limit: limit || null,
        offset: offset || 0,
        count: entities.length,
        total: count || undefined
      }
    }
  }

  async getOneByField(field: string, value: any): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(this.selectQuery)
      .eq(field, value)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data ? this.mapToEntity(data) : null
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return this.mapToEntity(created)
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return this.mapToEntity(updated)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  listenById(
    id: string,
    onUpdate: (data: T) => void,
    onError?: (err: Error) => void
  ): () => void {
    const channel = supabase
      .channel(`public:${this.tableName}:id=${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
          filter: `id=eq.${id}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.new) onUpdate(this.mapToEntity(payload.new))
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' && onError)
          onError(err || new Error('Channel error'))
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  listenByField(
    field: keyof T,
    value: string,
    onUpdate: (data: T) => void,
    onError?: (err: Error) => void
  ): () => void {
    const channel = supabase
      .channel(`public:${this.tableName}:${String(field)}=${value}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
          filter: `${String(field)}=eq.${value}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.new) onUpdate(this.mapToEntity(payload.new))
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' && onError)
          onError(err || new Error('Channel error'))
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  listenAllByField(
    field: keyof T,
    value: any,
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options?: {
      limit?: number
      orderBy?: keyof T
      orderDirection?: 'asc' | 'desc'
    }
  ): () => void {
    const channel = supabase
      .channel(
        `public:${this.tableName}:all_by_field:${String(field)}=${value}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
          filter: `${String(field)}=eq.${value}`
        },
        async () => {
          try {
            const result = await this.getAllByField(
              field,
              value,
              options?.limit
            )
            onUpdate(result.data)
          } catch (err) {
            if (onError) onError(err as Error)
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' && onError)
          onError(err || new Error('Channel error'))
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  listenAll(
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options?: {
      filters?: Partial<T>
      limit?: number
      orderBy?: keyof T
      orderDirection?: 'asc' | 'desc'
    }
  ): () => void {
    const channel = supabase
      .channel(`public:${this.tableName}:all`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: this.tableName },
        async () => {
          try {
            const result = await this.getAll(
              options?.limit,
              0,
              undefined,
              options?.filters
            )
            onUpdate(result.data)
          } catch (err) {
            if (onError) onError(err as Error)
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' && onError)
          onError(err || new Error('Channel error'))
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }
}
