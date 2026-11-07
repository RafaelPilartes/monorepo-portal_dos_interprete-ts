#!/usr/bin/env bash
# Deletes the local database and rebuilds it from the files, seed included, then stops it.
# Temporary instance: deleted at the end, also on failure or Ctrl+C. For a database that stays up
# to work against, use pnpm db:down && pnpm db:up.
source "$(dirname "$0")/lib.sh"

# claude-code-rules.md §5; cleanup_instance (lib.sh) also ignores a second Ctrl+C while it stops.
cleanup() { cleanup_instance; }
trap cleanup EXIT INT TERM HUP
# An interrupted script must not carry on to the next step: clean up and stop here.
trap 'cleanup; trap - EXIT; exit 130' INT TERM HUP

check_disk
supabase_cli stop --no-backup >/dev/null 2>&1 || true
start_instance
bash "$DB_ROOT/scripts/apply-all.sh"
bash "$DB_ROOT/scripts/migrate.sh" --status
say "reset-local: a base reconstruiu-se a partir dos ficheiros."
