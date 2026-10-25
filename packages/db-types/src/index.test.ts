import { describe, expectTypeOf, it } from 'vitest'
import type { Database, Tables } from './index'

describe('db-types', () => {
  it('exposes notify.notifications with read_at as the only column a reader changes', () => {
    type Notification = Tables<{ schema: 'notify' }, 'notifications'>
    expectTypeOf<Notification['read_at']>().toEqualTypeOf<string | null>()
    expectTypeOf<Notification['kind']>().toEqualTypeOf<string>()
  })

  it('exposes the notify functions with their arguments', () => {
    type Enqueue = Database['notify']['Functions']['enqueue']
    expectTypeOf<Enqueue['Args']['p_kind']>().toEqualTypeOf<string>()
    expectTypeOf<Enqueue['Returns']>().toEqualTypeOf<string>()
  })
})
