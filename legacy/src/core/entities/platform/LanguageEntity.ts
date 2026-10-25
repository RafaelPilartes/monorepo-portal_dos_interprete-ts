import { BaseEntity } from '../base/BaseEntity'
import { LanguageProps } from '@/type/database'

export class LanguageEntity extends BaseEntity {
  public readonly name: string
  public readonly code: string
  public readonly is_sign_language: boolean

  constructor(props: LanguageProps) {
    super(props.id, props.created_at, props.updated_at)
    this.name = props.name
    this.code = props.code
    this.is_sign_language = props.is_sign_language
  }
}
