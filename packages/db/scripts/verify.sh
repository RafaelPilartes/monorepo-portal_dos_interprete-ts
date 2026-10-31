#!/usr/bin/env bash
# pnpm db:verify (architecture.md §5): a clean instance, the six phases, the reapplicable phases a
# second time with the catalog compared, the generated types compared with the committed file,
# the SQL assertions, and the API tests that need a database. Temporary instance: it is deleted at the end, also on failure or Ctrl+C.
source "$(dirname "$0")/lib.sh"

# claude-code-rules.md §5; cleanup_instance (lib.sh) also ignores a second Ctrl+C while it stops.
cleanup() { cleanup_instance; }
trap cleanup EXIT INT TERM HUP
# An interrupted script must not carry on to the next step: clean up and stop here.
trap 'cleanup; trap - EXIT; exit 130' INT TERM HUP

check_disk
work="$(mktemp -d)"
scripts="$DB_ROOT/scripts"

say "== 1/6 base limpa"
supabase_cli stop --no-backup >/dev/null 2>&1 || true
start_instance

say "== 2/6 seis fases"
bash "$scripts/apply-all.sh"

say "== 3/6 a comparação do catálogo detecta mudanças"
catalog_snapshot > "$work/probe-before.sql"
psql_db -c "CREATE FUNCTION util.drift_probe() RETURNS int LANGUAGE sql AS 'SELECT 1'"
catalog_snapshot > "$work/probe-after.sql"
psql_db -c "DROP FUNCTION util.drift_probe()"
if cmp -s "$work/probe-before.sql" "$work/probe-after.sql"; then
  die "a fotografia do catálogo não viu uma função nova; a comparação seguinte não provaria nada."
fi

say "== 4/6 fases reaplicáveis outra vez, catálogo igual"
catalog_snapshot > "$work/first.sql"
for phase in $REAPPLICABLE_PHASES; do bash "$scripts/apply.sh" "$phase"; done
catalog_snapshot > "$work/second.sql"
if ! diff -u "$work/first.sql" "$work/second.sql" >&2; then
  die "reaplicar as fases mudou o catálogo (diferença acima): algum ficheiro não é reaplicável."
fi
bash "$scripts/migrate.sh" --status

say "== 4b/6 uma migration aplicada que mudou é recusada"
cp -r "$DB_ROOT/migrations" "$work/migrations"
copies=("$work/migrations"/*.sql)
echo "-- changed after being applied" >> "${copies[0]}"
if DB_PHASE_DIR="$work/migrations" bash "$scripts/migrate.sh" 2>"$work/refusal.txt"; then
  die "migrate.sh aceitou uma migration aplicada que mudou."
fi
grep -q "MUDOU" "$work/refusal.txt" || { cat "$work/refusal.txt" >&2; die "migrate.sh falhou, mas não pela razão certa (acima)."; }

say "== 5/6 tipos gerados iguais aos do repositório"
bash "$scripts/gen-types.sh" "$work/database.ts"
if ! diff -u "$REPO_ROOT/packages/db-types/src/database.ts" "$work/database.ts" >&2; then
  die "packages/db-types/src/database.ts não corresponde à base; corre pnpm db:types com a base de pé e faz commit."
fi

say "== 6/6 asserções"
bash "$scripts/run-tests.sh"

say "== 6b/6 API contra esta base (apps/api, pnpm test:db)"
pnpm --filter @portal-dos-interpretes/api test:db >&2

say "db:verify passou."
