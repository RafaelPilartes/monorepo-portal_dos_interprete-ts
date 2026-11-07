# Step F — Local Database Implementation Plan

> Executed inline in continuous mode; independent review at the end of the step.

**Goal:** the machinery that applies, verifies and rebuilds the database from files in `packages/db/`, plus the common skeleton (migration `0001-foundation.sql`). Tables of each feature arrive in their own step.

**Spec:** `docs/plan/specs/foundation.md` §F; `docs/plan/architecture.md` §5; `docs/plan/data-model.md` §0, §10, §11, §12; `docs/plan/claude-code-rules.md` §5.

## Global Constraints
- Supabase CLI as a root dev dependency (`pnpm exec supabase`), never installed on the system.
- Every script checks free disk first; below 10 GB it refuses, prints the cleanup commands in Portuguese and exits (`claude-code-rules.md` §5).
- Temporary instances (`verify.sh`, `reset-local.sh`, DB tests) start with the `trap cleanup EXIT INT TERM` of §5; the development instance (`db-up`/`db-down`) has no trap.
- Every migration opens with `BEGIN;` and closes with `COMMIT;`; applied migrations are immutable (sha256 in `util.applied_migrations`).
- Six phases, in order: migrations → functions → policies → grants → seed → schedule.
- Every table has RLS on; every `SECURITY DEFINER` function has `SET search_path = ''`; every FK has an index.

## Review Focus
1. Ctrl+C in the middle of `db:verify` leaves zero project containers.
2. A changed, already-applied migration is refused by `migrate.sh`.
3. `audit.events` refuses UPDATE/DELETE even for `service_role`.
4. The catalog comparison between applied-and-reapplied phases actually detects drift.
5. Generated types differ from the committed file → `db:verify` fails.

### Task 1: CLI, `supabase/config.toml` (schemas of architecture §5 exposed, buckets, local email), old `.sql` files moved to `docs/inventory/old-schema/`
### Task 2: scripts (`lib.sh` with disk check and psql helpers, `db-up`, `db-down`, `migrate`, `apply`, `verify`, `reset-local`)
### Task 3: migration `0001-foundation.sql`
### Task 4: SQL assertions in `packages/db/tests/` + runner
### Task 5: `packages/db-types` generation and drift check
### Task 6: `verify.py` checks of step F (BEGIN/COMMIT, RLS, search_path, FK index, R-CFG-05 patterns)
### Task 7: gates (including Ctrl+C test), review, close (v0.8.0)
