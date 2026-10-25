import type { IOwnRowsRepository } from '../../interfaces/IReadRepository'
import { translatePostgrestError } from '../../domain/errors/translatePostgrestError'
import { ReadOnlyDAO } from './ReadOnlyDAO'

/**
 * Reads plus the simple writes of a user on their own rows. The database
 * decides which columns are writable (column grants, architecture.md §5);
 * a refused column comes back as FORBIDDEN, never as a silent success.
 */
export class BaseSupabaseDAO<Row extends { id: string }, Insert extends object = Partial<Row>, Update extends object = Partial<Row>>
  extends ReadOnlyDAO<Row>
  implements IOwnRowsRepository<Row, Insert, Update>
{
  async create(values: Insert): Promise<Row> {
    const { data, error } = await this.table().insert(values).select().single()
    if (error) throw translatePostgrestError(error, this.where)
    return data as Row
  }

  async update(id: string, values: Update): Promise<Row> {
    const { data, error } = await this.table().update(values).eq('id', id).select().single()
    if (error) throw translatePostgrestError(error, this.where)
    return data as Row
  }
}
