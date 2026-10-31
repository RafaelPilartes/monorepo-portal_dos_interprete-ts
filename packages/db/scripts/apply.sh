#!/usr/bin/env bash
# Applies one reapplicable phase (architecture.md §5): every file of packages/db/<phase>/, in name
# order, all in one transaction. Files must be safe to run again (CREATE OR REPLACE,
# DROP ... IF EXISTS first); db:verify proves it by comparing the catalog after a second run.
#   apply.sh functions | policies | grants | schedule
source "$(dirname "$0")/lib.sh"

phase="${1:-}"
case " $REAPPLICABLE_PHASES " in
  *" $phase "*) ;;
  *) die "fase desconhecida: '${phase}' (uma de: $REAPPLICABLE_PHASES)" ;;
esac
instance_running || die "a base local não está a correr (pnpm db:up)."

shopt -s nullglob
files=("$DB_ROOT/$phase"/*.sql)
[ "${#files[@]}" -gt 0 ] || { say "nada em $phase."; exit 0; }
# The whole phase is one transaction: a failing file leaves the phase as it was, and nobody sees
# the moment between grants/00-reset.sql and the files that grant back.
{
  for file in "${files[@]}"; do
    printf '\\echo a aplicar %s\n' "$phase/$(basename "$file")"
    cat "$file"
    printf '\n'
  done
} | psql_quiet -1 -f - >&2 || die "a fase $phase falhou (o último ficheiro mostrado acima); nada desta fase ficou aplicado."
