import { BaseEntity } from '../base/BaseEntity'
import { BookingProps } from '@/type/database'
import { BookingStatus } from '@/type/enum'
import { ServiceEntity } from './ServiceEntity'

import { RequesterProfileEntity } from '../identity/RequesterProfileEntity'
import { InterpreterProfileEntity } from '../identity/InterpreterProfileEntity'

export class BookingEntity extends BaseEntity {
  public readonly requester_profile_id: string
  public readonly requester_profile?: RequesterProfileEntity

  public readonly interpreter_profile_id?: string
  public readonly interpreter_profile?: InterpreterProfileEntity

  public readonly service_id?: string
  public readonly service?: ServiceEntity

  public readonly status: BookingStatus

  public readonly scheduled_date: Date
  public readonly duration_minutes: number

  public readonly total_amount: number
  public readonly currency: string

  public readonly location_type: 'online' | 'presencial'
  public readonly meeting_link?: string
  public readonly address?: string

  public readonly notes?: string

  constructor(
    props: BookingProps & {
      service?: ServiceEntity
      requester_profile?: RequesterProfileEntity
      interpreter_profile?: InterpreterProfileEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.requester_profile_id = props.requester_profile_id
    this.requester_profile = props.requester_profile
    this.interpreter_profile_id = props.interpreter_profile_id
    this.interpreter_profile = props.interpreter_profile
    this.service_id = props.service_id
    this.service = props.service
    this.status = props.status
    this.scheduled_date = props.scheduled_date
    this.duration_minutes = props.duration_minutes
    this.total_amount = props.total_amount
    this.currency = props.currency
    this.location_type = props.location_type
    this.meeting_link = props.meeting_link
    this.address = props.address
    this.notes = props.notes
  }
}
