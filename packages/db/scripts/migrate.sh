#!/usr/bin/env bash
# Applies the migrations that are missing, in order (architecture.md §5).
#   migrate.sh            apply what is missing
#   migrate.sh --status   list each migration as applied / pending / CHANGED
#   migrate.sh --seed     the same for packages/db/seed (applied once, never reapplied)
# Refuses to run when an applied file changed or disappeared: an applied migration is immutable,
# the fix is a new one (CLAUDE.md). Each file carries its own BEGIN/COMMIT.
source "$(dirname "$0")/lib.sh"

phase="migrations"
prefix=""
status_only=false
for arg in "$@"; do
  case "$arg" in
    --status) status_only=true ;;
    --seed) phase="seed"; prefix="seed/" ;;
    *) die "opção desconhecida: $arg (usa --status ou --seed)" ;;
  esac
done

instance_running || die "a base local não está a correr (pnpm db:up)."
# DB_PHASE_DIR points at another copy of the directory; db:verify uses it to prove the refusal.
dir="${DB_PHASE_DIR:-$DB_ROOT/$phase}"

registry_exists="$(psql_value "SELECT to_regclass('util.applied_migrations') IS NOT NULL")"
applied=""
if [ "$registry_exists" = "t" ]; then
  if [ "$phase" = "seed" ]; then filter="name LIKE 'seed/%'"; else filter="name NOT LIKE '%/%'"; fi
  applied="$(psql_value "SELECT name || ' ' || sha256 FROM util.applied_migrations WHERE $filter ORDER BY name")"
fi

declare -A applied_sha=()
while read -r name sha; do
  [ -n "${name:-}" ] && applied_sha["$name"]="$sha"
done <<< "$applied"

problems=0
pending=()
shopt -s nullglob
files=("$dir"/*.sql)
declare -A on_disk=()
for file in "${files[@]}"; do
  name="${prefix}$(basename "$file")"
  on_disk["$name"]=1
  sha="$(file_sha256 "$file")"
  if [ -n "${applied_sha[$name]:-}" ]; then
    if [ "${applied_sha[$name]}" != "$sha" ]; then
      say "MUDOU    $name — já foi aplicada e o ficheiro mudou. Uma migration aplicada não se edita: escreve uma nova."
      problems=$((problems + 1))
    elif $status_only; then
      say "aplicada $name"
    fi
  else
    pending+=("$file")
    $status_only && say "por aplicar $name"
  fi
done
for name in "${!applied_sha[@]}"; do
  if [ -z "${on_disk[$name]:-}" ]; then
    say "FALTA    $name — está registada como aplicada mas o ficheiro desapareceu."
    problems=$((problems + 1))
  fi
done

[ "$problems" -eq 0 ] || die "$problems ficheiro(s) aplicado(s) não batem certo com o registo; nada foi aplicado."
$status_only && exit 0

# Every pending migration is checked before any is applied.
if [ "$phase" = "migrations" ]; then
  for file in "${pending[@]}"; do
    # awk reads the whole file: `grep | head -1` would end in SIGPIPE under pipefail.
    first="$(awk '!/^[[:space:]]*(--|$)/ { print; exit }' "$file")"
    last="$(awk '!/^[[:space:]]*(--|$)/ { line = $0 } END { print line }' "$file")"
    [ "$first" = "BEGIN;" ] && [ "$last" = "COMMIT;" ] \
      || die "$(basename "$file") tem de abrir com BEGIN; e fechar com COMMIT; — nada foi aplicado."
  done
fi

for file in "${pending[@]}"; do
  name="${prefix}$(basename "$file")"
  sha="$(file_sha256 "$file")"
  record="INSERT INTO util.applied_migrations (name, sha256) VALUES ('$name', '$sha');"
  say "a aplicar $name"
  if [ "$phase" = "migrations" ]; then
    # The record goes in just before the migration's own COMMIT: applied and recorded together.
    commit_line="$(awk '!/^[[:space:]]*(--|$)/ { n = NR } END { print n }' "$file")"
    { head -n "$((commit_line - 1))" "$file"; echo "$record"; echo "COMMIT;"; } \
      | psql_quiet -f - || die "$name falhou; nada dela ficou aplicado."
  else
    # Seed files run inside one transaction, with their record.
    { cat "$file"; echo; echo "$record"; } | psql_quiet -1 -f - || die "$name falhou; nada dele ficou aplicado."
  fi
done
[ "${#pending[@]}" -eq 0 ] && say "nada por aplicar em $phase."
exit 0
