import { BaseEntity } from '../base/BaseEntity'
import { DocumentProps } from '@/type/database'
import { DocumentType, VerificationStatus } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'

export class DocumentEntity extends BaseEntity {
  public readonly user_id: string
  public readonly user?: UserEntity

  public readonly type: DocumentType
  public readonly file_url: string
  public readonly file_name: string

  public readonly status: VerificationStatus
  public readonly admin_notes?: string

  public readonly reviewed_by_user_id?: string
  public readonly reviewed_by_user?: UserEntity

  public readonly reviewed_at?: Date

  constructor(
    props: DocumentProps & {
      user?: UserEntity
      reviewed_by_user?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.user_id = props.user_id
    this.user = props.user
    this.type = props.type
    this.file_url = props.file_url
    this.file_name = props.file_name
    this.status = props.status
    this.admin_notes = props.admin_notes
    this.reviewed_by_user_id = props.reviewed_by_user_id
    this.reviewed_by_user = props.reviewed_by_user
    this.reviewed_at = props.reviewed_at
  }
}
