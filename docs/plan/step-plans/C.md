# Step C — Empty Monorepo Implementation Plan

> **For agentic workers:** executed inline (native) in continuous mode (`docs/plan/claude-code-rules.md` §6), with one independent review at the end of the step (§6 e). Steps use checkbox syntax.

**Goal:** a pnpm + Turborepo monorepo with four empty web apps and an empty API that install, build, typecheck, lint and start, plus `verify.py`, the pre-push hook, ADR-001..007 and the API Dockerfile.

**Architecture:** root workspace (`apps/*`, `packages/*`, `legacy`); the old SPA moves untouched to `legacy/` (AD-008). Shared tooling lives in `packages/config`. Each app is Vite + React 18 + TS with a "starting" page and the version + commit in the footer; the API is Fastify 5 with `GET /health`.

**Tech Stack:** Node 22, pnpm 10, Turborepo 2, TypeScript 5 (strict), Vite 5, React 18, Tailwind 3, ESLint 9 (flat), Fastify 5, Vitest, Python 3 (verify.py).

**Spec:** `docs/plan/specs/foundation.md` §C (with "Melhorias da execução"), `docs/plan/architecture.md` §§2, 6, 9, 10.

## Global Constraints

- Package names `@portal-dos-interpretes/<name>` (AD-007); one version for everything: `0.2.0` when C closes.
- `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- ESLint `no-restricted-imports` for `@supabase/supabase-js` everywhere except `packages/data/src/dao/**`.
- Dev ports: site 5170, requester 5171, interpreter 5172, admin 5173, API 3000 (AD-006). No `server.host` in Vite config (AD-004).
- English identifiers/comments/tests/commits; Portuguese only on screen (D-84).
- Commit with `git commit -F`, no `Co-Authored-By`.

## Review Focus

1. `pnpm install` from a clean clone must not need the legacy app's lockfile (`package-lock.json`, `bun.lockb` go away; one `pnpm-lock.yaml`).
2. `verify.py` must fail loudly with file:line on each violation and pass on the clean tree — proved by `--self-test` against `scripts/fixtures/`.
3. The pre-push hook must be active after `pnpm install` (`core.hooksPath=.githooks`) and must not run `db:verify` when nothing under `packages/db/` changed.
4. `GET /health` returns JSON with `status`, `version`, `commit`, `migration_in_build`, `migration_in_database` (the last two `null` until F) — test with `fastify.inject`.
5. The footer version equals the root `package.json` version (test in a shared helper, not per app).

---

### Task 1: Move the old SPA to `legacy/`
**Files:** `git mv` of `src public index.html vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js eslint.config.js components.json package.json` to `legacy/`; delete `package-lock.json`, `bun.lockb`.
- [ ] `git mv` the files; set `legacy/package.json` name to `@portal-dos-interpretes/legacy-spa`, `private: true`, version `0.1.0`.
- [ ] Verify after Task 2 install: `pnpm --filter @portal-dos-interpretes/legacy-spa build` succeeds.

### Task 2: Workspace root
**Files:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.npmrc`.
- [ ] Root scripts: `dev`, `build`, `lint`, `typecheck`, `test` (turbo), `verify` (`python3 scripts/verify.py`), `db:*` placeholders that print "step F" and exit 1, `prepare` (`git config core.hooksPath .githooks`).
- [ ] `pnpm install` succeeds; `pnpm-lock.yaml` created.

### Task 3: `packages/config`
**Produces:** `@portal-dos-interpretes/config/eslint` (flat config factory `createEslintConfig({ react: boolean })`), `/tsconfig/*.json` (base re-export, `react.json`, `node.json`), `/vite` (`createViteConfig({ port })` with React plugin, `@` alias to `src`, `__APP_VERSION__`/`__APP_COMMIT__` defines), `/tailwind` preset.

### Task 4: Empty packages
`packages/{ui,i18n,core,auth,data,features,db,db-types}` each with `package.json`, `tsconfig.json`, `src/index.ts`, `lint`/`typecheck`/`test` scripts. `core` exports `APP_NAME`; `ui` exports `AppFooter({ version, commit })` (React) — test: renders "v0.2.0" and the commit.

### Task 5: Four apps
`apps/{site-web,requester-web,interpreter-web,admin-web}`: `index.html` (lang `pt`), `src/main.tsx`, `src/App.tsx` (page "Portal dos Intérpretes — <app> a arrancar" + `AppFooter`), `vite.config.ts` via `createViteConfig({ port })`, `public/.htaccess` SPA rewrite (architecture §8), Tailwind via preset.
- [ ] `pnpm build` builds the four; `pnpm dev` serves them on 5170–5173 (curl 200).

### Task 6: API
`apps/api`: `src/server.ts` (`buildServer(): FastifyInstance`), `src/index.ts` (listen `0.0.0.0:${PORT ?? 3000}`), `src/routes/health.ts`. Test `health.test.ts`: `GET /health` → 200 with keys `status: "ok"`, `version` = root version, `commit` (string or `"unknown"`), `migration_in_build: null`, `migration_in_database: null`.
- [ ] Test fails before route exists, passes after.

### Task 7: `scripts/verify.py` + fixtures
Checks (C): `no-direct-data-access` (`supabase.from|rpc|storage` or `fetch(` outside `packages/data/src/dao/`), `no-cross-app-import` (`apps/X` importing `apps/Y` or `@portal-dos-interpretes/<other app>`), `no-versioned-env` (`git ls-files` matching `(^|/)\.env$`), `english-identifiers` (identifiers in `apps/` and `packages/` containing a word from a Portuguese-only list). Scope: `apps/`, `packages/`; excludes `legacy/`, `node_modules`, `dist`, `scripts/fixtures`.
- [ ] `--self-test`: each check run against its fixture dir must fail; against the real tree must pass.

### Task 8: Pre-push hook, ADRs, Dockerfile
- [ ] `.githooks/pre-push`: `pnpm lint && pnpm typecheck && pnpm test && python3 scripts/verify.py`, plus `pnpm db:verify` only if the pushed range touches `packages/db/`.
- [ ] `docs/decisions/ADR-001.md`…`ADR-007.md` from architecture §10.
- [ ] `apps/api/Dockerfile` multi-stage with `pnpm deploy --filter @portal-dos-interpretes/api --prod`; `docker build -f apps/api/Dockerfile .` terminates (retry on Docker Hub 429).

### Task 9: Gates, review, close
- [ ] `pnpm install && pnpm build && pnpm typecheck && pnpm lint && pnpm test && python3 scripts/verify.py` — raw output into the step report.
- [ ] Independent reviewer subagent (§6 e); fix CONFIRMED.
- [ ] Version 0.2.0 everywhere, CHANGELOG, HANDOFF, run-log, commit, local tag, `scripts/release-tags.sh`, push `dev`.
