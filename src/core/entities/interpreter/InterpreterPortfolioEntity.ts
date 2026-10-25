import { BaseEntity } from '../base/BaseEntity'
import { InterpreterPortfolioProps } from '@/type/database'
import { InterpreterPortfolioType } from '@/type/enum'

export class InterpreterPortfolioEntity extends BaseEntity {
  public readonly interpreter_profile_id: string
  public readonly title: string
  public readonly url: string
  public readonly type: InterpreterPortfolioType
  public readonly thumbnail_url?: string
  public readonly description?: string
  public readonly tags?: string[]

  constructor(props: InterpreterPortfolioProps) {
    super(props.id, props.created_at, props.updated_at)
    this.interpreter_profile_id = props.interpreter_profile_id
    this.title = props.title
    this.url = props.url
    this.type = props.type
    this.thumbnail_url = props.thumbnail_url
    this.description = props.description
    this.tags = props.tags
  }
}
