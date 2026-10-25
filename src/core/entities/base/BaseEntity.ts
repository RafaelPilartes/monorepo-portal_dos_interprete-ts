export abstract class BaseEntity {
  public readonly id: string
  public readonly created_at: Date
  public readonly updated_at?: Date

  constructor(id: string, created_at?: Date, updated_at?: Date) {
    this.id = id
    this.created_at = created_at ?? new Date()
    this.updated_at = updated_at
  }
}
