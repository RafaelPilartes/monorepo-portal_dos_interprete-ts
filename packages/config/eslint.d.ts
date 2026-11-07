import type { Linter } from 'eslint'

export const DAO_FILES: string[]
export function createEslintConfig(options?: { react?: boolean; node?: boolean; daoFiles?: string[] }): Linter.Config[]
declare const config: Linter.Config[]
export default config
