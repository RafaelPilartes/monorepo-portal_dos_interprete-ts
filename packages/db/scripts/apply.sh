#!/usr/bin/env bash
# Applies one reapplicable phase (architecture.md §5): every file of packages/db/<phase>/, in name
# order, each in its own transaction. Files must be safe to run again (CREATE OR REPLACE,
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
for file in "${files[@]}"; do
  say "a aplicar $phase/$(basename "$file")"
  psql_quiet -1 -f - < "$file" || die "$phase/$(basename "$file") falhou; nada desse ficheiro ficou aplicado."
done
