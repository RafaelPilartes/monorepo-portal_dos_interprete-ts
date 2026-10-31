// The executable schema lives in this package as SQL and shell (architecture.md §5): migrations/,
// functions/, policies/, grants/, seed/, schedule/, tests/ and scripts/. This module only names
// the phases, in the order scripts/apply-all.sh applies them.
export const PACKAGE_NAME = '@portal-dos-interpretes/db'

export const PHASES = ['migrations', 'functions', 'policies', 'grants', 'seed', 'schedule'] as const
