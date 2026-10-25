# Shared helpers for the packages/db scripts (architecture.md §5, claude-code-rules.md §5).
# Sourced, never run. Messages for people are in Portuguese; code and comments in English.

set -euo pipefail

DB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$DB_ROOT/../.." && pwd)"
PROJECT_ID="portal-dos-interpretes"
DB_CONTAINER="supabase_db_${PROJECT_ID}"
MIN_FREE_GB="${MIN_FREE_GB:-10}"
# The schemas the project owns (architecture.md §5); types and catalog snapshots cover these.
OWN_SCHEMAS="identity catalog directory config booking billing verification community support notify audit analytics util auth_helper"
EXPOSED_SCHEMAS="identity,catalog,directory,config,booking,billing,verification,community,support,notify,audit,analytics"
REAPPLICABLE_PHASES="functions policies grants schedule"

cd "$REPO_ROOT"

say() { printf '%s\n' "$*" >&2; }
die() { say "ERRO: $*"; exit 1; }

supabase_cli() { pnpm exec supabase "$@"; }

# Below MIN_FREE_GB of free disk nothing starts (claude-code-rules.md §5).
check_disk() {
  local free_kb free_gb
  free_kb="$(df -Pk "$REPO_ROOT" | awk 'NR==2 {print $4}')"
  free_gb=$((free_kb / 1024 / 1024))
  if [ "$free_gb" -lt "$MIN_FREE_GB" ]; then
    say "ERRO: só há ${free_gb} GB livres; a base local precisa de pelo menos ${MIN_FREE_GB} GB."
    say "Para ver o que ocupa espaço:   docker system df"
    say "Para libertar espaço:          docker volume prune   e   docker image prune"
    exit 1
  fi
}

# docker inspect, not `docker ps | grep -q`: with pipefail, grep -q closing the pipe early makes
# docker exit with SIGPIPE and the whole test false.
instance_running() {
  [ "$(docker inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null)" = "true" ]
}

# Docker Hub rate-limits anonymous pulls; the first start of a session may need retries.
# The health check is skipped here: PostgREST only turns healthy once the exposed schemas exist,
# and they are created by the migrations that run after the start. wait_for_api checks it then.
start_instance() {
  local attempt
  for attempt in 1 2 3 4 5; do
    if supabase_cli start --ignore-health-check >/dev/null && instance_running; then
      return 0
    fi
    say "Arranque falhou (tentativa ${attempt} de 5); a tentar outra vez dentro de $((attempt * 10)) s."
    supabase_cli stop --no-backup >/dev/null 2>&1 || true
    sleep $((attempt * 10))
  done
  die "a base local não arrancou ao fim de 5 tentativas."
}

# After the phases: PostgREST reloads its schema cache and every container reports healthy.
wait_for_api() {
  local waited=0 unhealthy
  psql_db -c "NOTIFY pgrst, 'reload schema'" >/dev/null
  while true; do
    unhealthy="$(docker ps --filter "name=_${PROJECT_ID}" --format '{{.Names}} {{.Status}}' | grep -v '(healthy)' | grep '(' || true)"
    [ -z "$unhealthy" ] && return 0
    if [ "$waited" -eq 30 ]; then
      docker restart "supabase_rest_${PROJECT_ID}" >/dev/null
    fi
    if [ "$waited" -ge 120 ]; then
      say "$unhealthy"
      die "a base local arrancou mas há serviços que não ficaram saudáveis em 120 s (acima)."
    fi
    sleep 3
    waited=$((waited + 3))
  done
}

stop_instance() {
  supabase_cli stop --no-backup >&2
}

# psql inside the database container, so the host needs no Postgres client.
psql_db() {
  docker exec -i "$DB_CONTAINER" psql -X -q -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"
}

# The same without NOTICE chatter (applying files).
psql_quiet() {
  docker exec -i -e PGOPTIONS='-c client_min_messages=warning' "$DB_CONTAINER" \
    psql -X -q -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"
}

# One value, no decoration.
psql_value() {
  psql_db -At -c "$1"
}

file_sha256() {
  sha256sum "$1" | awk '{print $1}'
}

# Name, schema-only dump of the project's schemas (with grants and policies) plus the cron jobs:
# what must not change when the reapplicable phases run a second time.
catalog_snapshot() {
  local args=() schema
  for schema in $OWN_SCHEMAS; do args+=(-n "$schema"); done
  docker exec "$DB_CONTAINER" pg_dump -U postgres -d postgres --schema-only --no-owner "${args[@]}" \
    | grep -v '^-- Dumped \|^\\restrict\|^\\unrestrict'
  printf '\n-- cron jobs\n'
  psql_db -At -c "SELECT jobname || ' | ' || schedule || ' | ' || command FROM cron.job ORDER BY jobname"
  printf '\n-- storage buckets\n'
  psql_db -At -c "SELECT id || ' | ' || public || ' | ' || coalesce(file_size_limit::text, '') || ' | ' || coalesce(array_to_string(allowed_mime_types, ','), '') FROM storage.buckets ORDER BY id"
}
