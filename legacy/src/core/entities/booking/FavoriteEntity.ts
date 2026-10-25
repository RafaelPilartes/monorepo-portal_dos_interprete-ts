import { BaseEntity } from '../base/BaseEntity'
import { FavoriteProps } from '@/type/database'
import { RequesterProfileEntity } from '../identity/RequesterProfileEntity'
import { InterpreterProfileEntity } from '../identity/InterpreterProfileEntity'

export class FavoriteEntity extends BaseEntity {
  public readonly requester_profile_id: string
  public readonly requester_profile?: RequesterProfileEntity

  public readonly interpreter_profile_id: string
  public readonly interpreter_profile?: InterpreterProfileEntity

  constructor(
    props: FavoriteProps & {
      requester_profile?: RequesterProfileEntity
      interpreter_profile?: InterpreterProfileEntity
    }
  ) {
    super(props.id, props.created_at)
    this.requester_profile_id = props.requester_profile_id
    this.requester_profile = props.requester_profile
    this.interpreter_profile_id = props.interpreter_profile_id
    this.interpreter_profile = props.interpreter_profile
  }
}
