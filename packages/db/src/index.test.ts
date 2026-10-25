import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME, PHASES } from './index'

const root = join(__dirname, '..')

describe('db', () => {
  it('is wired into the workspace', () => {
    expect(PACKAGE_NAME).toBe('@portal-dos-interpretes/db')
  })

  it('has a directory for every phase', () => {
    const directories = readdirSync(root)
    for (const phase of PHASES) expect(directories).toContain(phase)
  })

  it('applies the phases in the documented order, schedule last', () => {
    const script = readFileSync(join(root, 'scripts', 'apply-all.sh'), 'utf8')
    const order = [...script.matchAll(/(migrate\.sh"?(?: --seed)?|apply\.sh"? \w+)/g)].map((m) =>
      (m[1] ?? '').replace('"', ''),
    )
    expect(order).toEqual([
      'migrate.sh',
      'apply.sh functions',
      'apply.sh policies',
      'apply.sh grants',
      'migrate.sh --seed',
      'apply.sh schedule',
    ])
  })
})
