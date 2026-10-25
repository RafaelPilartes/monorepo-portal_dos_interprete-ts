import type { Linter } from 'eslint'

export function createEslintConfig(options?: {
  react?: boolean
  node?: boolean
  allowSupabase?: boolean
}): Linter.Config[]
declare const config: Linter.Config[]
export default config
