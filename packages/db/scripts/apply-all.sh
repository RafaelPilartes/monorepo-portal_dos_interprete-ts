#!/usr/bin/env bash
# The six phases in order (architecture.md §5): migrations → functions → policies → grants → seed
# → schedule. Schedule is always last: a cron job starts running as soon as it is registered.
source "$(dirname "$0")/lib.sh"
scripts="$DB_ROOT/scripts"
bash "$scripts/migrate.sh"
bash "$scripts/apply.sh" functions
bash "$scripts/apply.sh" policies
bash "$scripts/apply.sh" grants
bash "$scripts/migrate.sh" --seed
bash "$scripts/apply.sh" schedule
wait_for_api
