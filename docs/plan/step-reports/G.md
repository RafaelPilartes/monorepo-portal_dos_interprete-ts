# Relatório do passo G — API (v0.9.0, 2026-10-25)

## O que mudou
- **Configuração** (`config/env.ts`, zod): variáveis em falta ou inválidas param o arranque com a lista dos nomes em português; um valor vazio de um `.env` copiado conta como não definido; `TRUST_PROXY_HOPS` é obrigatório em produção.
- **Plugins:** `errors` (tudo sai no formato do catálogo; o texto técnico só vai para o log), `auth` (conta do JWT verificado pela JWKS do Auth, estado da conta pela base; rotas fechadas por omissão; 404 para rotas inexistentes), `staff` (níveis; `super_admin` passa sempre), `audit` (`audit.record` com `request_id` e IP, na mesma transacção quando há uma), `rateLimit` (por conta, ou por IP sem conta; `/health` também limitado).
- **Base:** cada unidade de trabalho corre como `service_role`; ligações e instruções com tempo máximo.
- **`GET /health`:** 200 só com a base a responder e a migration do build aplicada; senão 503.
- **Worker do email:** a máquina de estados em SQL (`notify.claim_emails`, `mark_email_sent`, `mark_email_failed`; reserva de 15 minutos); o worker só desenha e envia, com tempos máximos no SMTP; um email entregue nunca é registado como falhado.
- **Ficheiros privados:** `POST /uploads/sign` e `GET /files/url`, com a autorização em `util.can_access_file` (fechada até cada passo a preencher), leituras da equipa auditadas, ficheiro inexistente → `NOT_FOUND`.
- **Build:** API empacotada com `tsup`; a imagem Docker constrói e arranca.
- **`verify.py`:** `api-error-shape`, `bucket-limits`, e `fetch` só em `apps/api/src/integrations/` (18 verificações).

## Prova — saída em bruto
### `pnpm db:verify` (inclui os testes da API contra a base)
```
ok - every foreign key has an index that starts with its columns
ok - the 14 project schemas and the four extensions exist
ok - the migration is recorded with its sha256 and the notification catalog is loaded
ok - util.now() follows only util.test_clock; util.app_timezone() is Africa/Luanda
ok - util.next_code counts per prefix and Luanda year, restarts in the new year and never truncates
ok - util domains accept well-formed values and refuse malformed ones, links leaving the site included
ok - audit.record writes the event with the real time (never the test clock), request id and IP
ok - audit.events refuses UPDATE, DELETE and TRUNCATE even for the table owner
ok - service_role cannot UPDATE, DELETE or INSERT audit.events (only audit.record writes) nor move the clock
ok - a kind outside the catalog is refused by notify.enqueue and by the foreign key (R-NOT-01)
ok - notify.enqueue follows the channels of the kind (portal, portal + email, email only)
ok - notify.enqueue refuses a link that leaves the site
ok - notify.enqueue_email queues an email without an account and refuses portal-only kinds
ok - a second account has its own notification
ok - service_role writes notifications and emails only through notify.enqueue (R-NOT-02)
ok - anon reads no notification and runs no auth_helper function
ok - an account reads its notifications and marks them read, and nothing else (R-NOT-05)
# 0002-api-support.sql
ok - account_status and staff_level_of answer for the API auth plugin
ok - util.can_access_file refuses every purpose and mode until each step fills it
ok - the email outbox state machine: claim with a lease, retry, and no late overwrite
ok - the session cannot run the email worker, file access or account status functions
testes da base: 2 ficheiro(s), todos passaram.
== 6b/6 API contra esta base (apps/api, pnpm test:db)

> @portal-dos-interpretes/api@0.8.0 test:db /home/user/monorepo-portal_dos_interprete-ts/apps/api
> vitest run --config vitest.db.config.ts


 RUN  v3.2.7 /home/user/monorepo-portal_dos_interprete-ts/apps/api

 ✓ src/api.db.test.ts (7 tests) 603ms
 ✓ src/jobs/emailOutbox.db.test.ts (4 tests) 398ms
 ✓ src/integrations/storage.db.test.ts (2 tests) 164ms

 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  20:51:01
   Duration  7.26s (transform 305ms, setup 4.63s, collect 743ms, tests 1.17s, environment 1ms, prepare 231ms)

db:verify passou.

real	1m20.667s
user	0m22.060s
sys	0m6.877s
```

### O binário real e a imagem
```
$ node dist/index.js (sem variáveis)
A API não arranca: a configuração tem problemas.
  - DATABASE_URL: falta
  - SUPABASE_URL: falta
  - SUPABASE_SERVICE_ROLE_KEY: falta
  - APP_ORIGINS: falta
  - SMTP_HOST: falta
  - SMTP_PORT: falta
  - EMAIL_FROM: falta
Vê .env.example.
exit=1
$ curl /health
{"status":"ok","version":"0.8.0","commit":"a6fcc26","migration_in_build":"0001-foundation.sql","migration_in_database":"0001-foundation.sql"} HTTP 200
$ curl -X POST /uploads/sign (sem token)
{"error":{"code":"UNAUTHENTICATED","message":"A tua sessão terminou. Entra outra vez.","field":null}} HTTP 401
$ curl /nada
{"error":{"code":"NOT_FOUND","message":"Não encontrámos o que procuras.","field":null}} HTTP 404
api exit after SIGTERM=0
$ docker run --rm portal-api:g (sem variáveis)
A API não arranca: a configuração tem problemas.
  - DATABASE_URL: falta
  - SUPABASE_URL: falta
  - SUPABASE_SERVICE_ROLE_KEY: falta
  - APP_ORIGINS: falta
  - SMTP_HOST: falta
  - SMTP_PORT: falta
  - EMAIL_FROM: falta
Vê .env.example.
exit=1
$ docker run (só HEALTH: base inexistente)
{"status":"degraded","version":"0.8.0","commit":"a6fcc26","migration_in_build":"0001-foundation.sql","migration_in_database":null} HTTP 503
```
(Antes das correcções da revisão; a versão nas respostas é a de então.)

### Portões do workspace
```
$ pnpm lint
@portal-dos-interpretes/ui:lint: ✖ 7 problems (0 errors, 7 warnings)
@portal-dos-interpretes/auth:lint: ✖ 1 problem (0 errors, 1 warning)
 Tasks:    15 successful, 15 total
$ pnpm typecheck
 Tasks:    15 successful, 15 total
$ pnpm test
@portal-dos-interpretes/core:test:       Tests  24 passed (24)
@portal-dos-interpretes/db-types:test:       Tests  2 passed (2)
@portal-dos-interpretes/data:test:       Tests  20 passed (20)
@portal-dos-interpretes/i18n:test:       Tests  11 passed (11)
@portal-dos-interpretes/ui:test:       Tests  11 passed (11)
@portal-dos-interpretes/auth:test:       Tests  20 passed (20)
@portal-dos-interpretes/features:test:       Tests  3 passed (3)
@portal-dos-interpretes/interpreter-web:test:       Tests  33 passed (33)
@portal-dos-interpretes/requester-web:test:       Tests  14 passed (14)
@portal-dos-interpretes/admin-web:test:       Tests  25 passed (25)
@portal-dos-interpretes/site-web:test:       Tests  5 passed (5)
@portal-dos-interpretes/db:test:       Tests  3 passed (3)
@portal-dos-interpretes/api:test:       Tests  45 passed (45)
 Tasks:    14 successful, 14 total
$ pnpm build
 Tasks:    5 successful, 5 total
$ python3 scripts/verify.py
ok   no-direct-data-access
ok   no-cross-app-import
ok   no-versioned-env
ok   english-identifiers
ok   single-version
ok   package-dependencies
ok   error-catalog
ok   no-duplicated-component
ok   migration-transaction
ok   table-rls
ok   definer-search-path
ok   fk-index
ok   domain-patterns
ok   notify-kinds
ok   rule-clock
ok   schema-lists
ok   bucket-limits
ok   api-error-shape

verify.py: 18/18 checks passed
$ python3 scripts/verify.py --self-test
self-test: 18/18 checks behave
```

## Revisão independente
17 achados (0 altos). Corrigidos:
1. **Um email entregue podia ser marcado como falhado e reenviado** quando o registo do sucesso falhava (CONFIRMADO): o envio e o registo têm agora tratamentos separados; teste novo.
2. **A reserva de 15 min podia acabar a meio de um lote lento** (PLAUSÍVEL): tempos máximos no SMTP e o worker pára de enviar aos 10 minutos.
3. **JWKS inacessível dava 401 a toda a gente** (CONFIRMADO): só erros do próprio token dão 401; testes com o verificador real (expirado, audiência errada, `anon`, sem assinatura, ilegível, servidor de chaves inacessível). Também passou a exigir `exp`. A revisão ainda apanhou de lado um token ilegível que dava 500.
4. **`42501` virava "Não tens permissão" sem log** (CONFIRMADO): na API é um grant em falta, logo `INTERNAL_ERROR`; todo o erro da base que não seja `P0001` vai para o log.
5–6. **`bucket-limits` e `api-error-shape` deixavam passar** regras noutro formato, chaves entre aspas, calculadas ou abreviadas (CONFIRMADO): agora falham; fixtures com os exemplos da revisão.
7. **`/health` sem limite e o pool sem tempo máximo** (CONFIRMADO): limite antes de qualquer rota; `connectionTimeoutMillis` e `statement_timeout`.
9. **`TRUST_PROXY_HOPS` 0 em produção** (PLAUSÍVEL): obrigatório em produção.
10. **`.env.example` copiado não arrancava** (CONFIRMADO): vazio = não definido.
11. **Links dos emails iam para o site público** (CONFIRMADO): o aviso diz a que app pertence (`payload.app`); sem app, o email não leva link.
13. **Ficheiro inexistente dava 500** (PLAUSÍVEL): `NOT_FOUND`.
15. **Texto "até N MB" repetido** (CONFIRMADO): calculado do limite.
- Teste SQL novo: a sessão não corre `mark_email_*`.

Registados sem mudança (AD-028): 8 (limite depois da autenticação), 12 (413/415 sem código próprio), 14 (limites no remoto), 16 (leitura de R-NOT-02), 17 (health durante um deploy).

## O que não foi verificado
- Envio real por um fornecedor de email (só o Mailpit local).
- A API atrás de um proxy real (só a função de saltos, com testes).
