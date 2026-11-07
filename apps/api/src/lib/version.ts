import { readFileSync } from 'node:fs'

// One version for the whole monorepo (architecture.md §9). The bundle gets it from tsup's define;
// tests and `tsx` read apps/api/package.json (two levels up from src/lib).
declare const __API_VERSION__: string | undefined

export const API_VERSION: string =
  typeof __API_VERSION__ === 'string'
    ? __API_VERSION__
    : (JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string }).version
