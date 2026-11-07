#!/usr/bin/env bash
# Runs the named SQL assertions of packages/db/tests/ against the live database. Each file runs
# inside a transaction that is rolled back, so tests leave no data behind. An assertion prints
# "ok - <name>" (RAISE NOTICE) or stops its file with an error naming it.
source "$(dirname "$0")/lib.sh"
instance_running || die "a base local não está a correr."

shopt -s nullglob
files=("$DB_ROOT/tests"/*.sql)
[ "${#files[@]}" -gt 0 ] || die "nenhum teste em packages/db/tests/."
failed=0
for file in "${files[@]}"; do
  say "# $(basename "$file")"
  if ! { echo "BEGIN;"; cat "$file"; echo; echo "ROLLBACK;"; } | psql_db -f - 2>&1 | sed -e 's/^psql:<stdin>:[0-9]*: //' -e 's/^NOTICE:  //' >&2; then
    failed=$((failed + 1))
  fi
done
if [ "$failed" -gt 0 ]; then
  say "testes da base: $failed ficheiro(s) com falhas."
  exit 1
fi
say "testes da base: ${#files[@]} ficheiro(s), todos passaram."
