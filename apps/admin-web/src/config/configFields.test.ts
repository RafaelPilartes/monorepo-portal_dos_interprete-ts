import { describe, expect, it } from 'vitest'
import type { ConfigVersionRow } from '@/data/repositories'
import { ALL_FIELDS, differences, displayValue, parseFieldInput } from './configFields'

const field = (name: string) => ALL_FIELDS.find((definition) => definition.field === name)!

describe('configuration fields', () => {
  it('sees no difference between 80 and "80.00" for a numeric value', () => {
    const current = { managed_interpreter_share_pct: 80, invite_expiry_hours: 48 } as unknown as ConfigVersionRow
    const draft = { managed_interpreter_share_pct: '80.00', invite_expiry_hours: 47 } as unknown as ConfigVersionRow
    expect(differences(current, draft).map((definition) => definition.field)).toEqual(['invite_expiry_hours'])
    expect(displayValue(field('managed_interpreter_share_pct'), '80.00')).toBe('80 %')
  })

  it('reads form input and refuses what the database would refuse', () => {
    expect(parseFieldInput(field('invite_expiry_hours'), ' 36 ')).toEqual({ value: 36 })
    expect(parseFieldInput(field('invite_expiry_hours'), '')).toEqual({ value: null })
    expect(parseFieldInput(field('invite_expiry_hours'), '-1')).toHaveProperty('error')
    expect(parseFieldInput(field('tax_rate_pct'), '12,5')).toEqual({ value: 12.5 })
    expect(parseFieldInput(field('tax_rate_pct'), '101')).toHaveProperty('error')
    expect(parseFieldInput(field('academia_iban'), 'AO06 0000 0000 0000 0000 0000 0')).toEqual({ value: 'AO06000000000000000000000' })
    expect(parseFieldInput(field('academia_iban'), 'PT50000')).toHaveProperty('error')
  })
})
