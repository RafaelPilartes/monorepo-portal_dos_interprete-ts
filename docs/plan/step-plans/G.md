# Step G — API Implementation Plan

> Executed inline in continuous mode; independent review at the end of the step.

**Goal:** `apps/api` ready to take feature routes: validated configuration, the five plugins (auth, staff, audit, rateLimit, errors), one error catalog, health with migrations, the email worker with the local adapter, and the two file routes with authorisation delegated to SQL.

**Spec:** `docs/plan/specs/foundation.md` §G; `docs/plan/architecture.md` §6; `docs/plan/api.md` §§1–3, 6, 15; `docs/plan/specs/notifications.md` (R-NOT-03).

## Decisions taken here (answering the brainstorm questions myself, claude-code-rules.md §3)
- **Database access:** `pg` pool on `DATABASE_URL`; every query runs in a transaction that starts with `SET LOCAL ROLE service_role`, so the API holds exactly the privileges `packages/db/grants/` gives `service_role`, never the connection owner's. No PostgREST from the API.
- **Storage:** the API signs upload/read URLs through the Storage HTTP API with the service key, in `apps/api/src/integrations/storage.ts`. `verify.py` (`no-direct-data-access`) allows `fetch(` in `apps/api/src/integrations/` only — the API's one door to outside services, as `packages/data/src/dao/` is for the apps.
- **JWT:** verified locally against the Auth server's JWKS (`/auth/v1/.well-known/jwks.json`), falling back to the shared secret when the server signs with HS256; `sub` is the account. No network round-trip per request.
- **Account state (ACCOUNT_SUSPENDED, TERMS_ACCEPTANCE_REQUIRED) and staff level** come from SQL functions `auth_helper.account_status(uuid)` and `auth_helper.staff_level_of(uuid)` (EXECUTE `service_role`). Until H1 creates the identity tables they answer `active` and `NULL`; H1 rewrites them. The plugins never decide on their own.
- **Email worker:** SQL owns the state machine: `notify.claim_emails(limit)` (FOR UPDATE SKIP LOCKED; also re-claims `sending` rows stuck for 15 minutes), `notify.mark_email_sent(id)`, `notify.mark_email_failed(id, error)` (retries at 1, 5 and 30 minutes, `failed` at the fourth failure). The worker only renders and sends. Templates per kind live in `apps/api/src/integrations/email/templates.ts`; a kind without its own template uses a generic Portuguese one (feature steps add theirs).
- **File authorisation:** `util.can_access_file(account, purpose, subject, mode)` (mode `write`/`read`), one function per purpose called from it, all `false` until each step fills them. Buckets by purpose: `payment_proof` → `payment-proofs`, `verification_document` → `verification-docs`, `chat_attachment` → `chat-attachments`, `ticket_attachment` → `support-attachments` (new private bucket, 5 MB PDF/JPG/PNG; `architecture.md` §5 lists no bucket for tickets).
- **Health:** `200 { status: "ok" }` when the database answers and its last migration equals the build's; otherwise `503 { status: "degraded" }` with the same fields, so a deploy check catches a missing migration.

## Review Focus
1. A request without a token, with a malformed, expired or wrongly signed token → `401 UNAUTHENTICATED`, never 500.
2. A forced database error reaches the client as `INTERNAL_ERROR` with the generic message and no technical text; the real text is in the log.
3. Two workers claiming at once never send the same email twice (SKIP LOCKED), and a crash mid-send does not lose the email.
4. `trustProxy` is a fixed hop count, never `true`; rate limits key on the account when there is one, else on the IP.
5. `/uploads/sign` refuses a wrong type or size with `FILE_INVALID` before asking SQL, and a path outside the caller's grant with `FORBIDDEN`.

### Task 1: `config/env.ts` (zod) — missing or invalid variables stop the start with a Portuguese list of names
### Task 2: `lib/sendApiError.ts`, `lib/dbErrors.ts`, `plugins/errors.ts` (catalog from `@portal-dos-interpretes/core/errors`)
### Task 3: `lib/db.ts` (pool, `withServiceRole`), SQL functions of the step (functions/, grants/), health with migrations
### Task 4: `plugins/auth.ts`, `plugins/staff.ts`, `plugins/audit.ts`, `plugins/rateLimit.ts`
### Task 5: email worker (`jobs/emailOutbox.ts`, `integrations/email/`), local SMTP port in `supabase/config.toml`
### Task 6: `POST /uploads/sign`, `GET /files/url` (`integrations/storage.ts`)
### Task 7: tests with `fastify.inject` against the local database; gates, review, close (v0.9.0)
