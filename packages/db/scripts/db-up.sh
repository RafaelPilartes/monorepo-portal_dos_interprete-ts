#!/usr/bin/env bash
# Development instance (claude-code-rules.md §5): starts the local stack and applies what is
# missing. No cleanup trap on purpose: it stays up until `pnpm db:down`.
source "$(dirname "$0")/lib.sh"
check_disk
if instance_running; then
  say "a base local já está a correr; a aplicar o que falta."
else
  start_instance
fi
bash "$DB_ROOT/scripts/apply-all.sh"
say "base local pronta: API em http://127.0.0.1:54321, email em http://127.0.0.1:54324."
