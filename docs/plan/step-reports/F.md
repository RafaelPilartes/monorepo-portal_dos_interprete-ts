# Relatório do passo F — base de dados local (v0.8.0, 2026-10-25)

## O que mudou
- **CLI do Supabase** como dependência da raiz (`supabase@2.122.0`) e `supabase/config.toml`: os 12 schemas de domínio expostos (sem `public`), oito buckets com limites (AD-022), email local, confirmação de email e palavra-passe com letras e números. Os `.sql` antigos foram para `docs/inventory/old-schema/`.
- **Scripts** em `packages/db/scripts/`: `db-up`/`db-down` (instância de desenvolvimento), `migrate.sh` (recusa migrations aplicadas que mudaram ou desapareceram; regista cada uma dentro da sua transacção), `apply.sh` (cada fase reaplicável numa só transacção), `verify.sh` (`pnpm db:verify`), `reset-local.sh`, `gen-types.sh`, `run-tests.sh`, `interrupt-test.py`. Todos verificam o disco (≥ 10 GB); os temporários limpam no fim, numa falha e num Ctrl+C.
- **Migration `0001-foundation.sql`:** 14 schemas, extensões, domínios `util.*` (telefone, NIF, IBAN, slug, email, link interno), registo de migrations, relógio de teste, contadores de códigos, `audit.events` só de acrescentar, e as tabelas de `notify`.
- **Funções reaplicáveis:** `util.now`, `util.next_code`, `util.app_timezone`, `util.project_schemas`, `audit.record`, `notify.enqueue`, `notify.enqueue_email`, `auth_helper.account_id`/`is_active`; o catálogo de 57 avisos gerado de `notifications.md`.
- **Nasce fechado:** `grants/00-reset.sql` revoga tudo a todos os papéis antes de cada aplicação; só `UPDATE (read_at)` em `notify.notifications` fica para a sessão do utilizador.
- **`packages/db-types`:** tipos gerados e formatados; `db:verify` falha se divergirem.
- **`verify.py`:** 8 verificações novas (16 no total), cada uma com fixture e gémeo limpo.

## Prova — saída em bruto
### `pnpm db:verify` (de raiz)
```

> @portal-dos-interpretes/root@0.7.0 db:verify /home/user/monorepo-portal_dos_interprete-ts
> bash packages/db/scripts/verify.sh

== 1/6 base limpa
25/Oct/2026:20:14:35 +0000: Starting PostgREST 16.5...
25/Oct/2026:20:14:35 +0000: Admin server listening on 0.0.0.0:3001
25/Oct/2026:20:14:35 +0000: Listener connected to PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit on "supabase_db_portal-dos-interpretes:5432" and listening for database notifications on the "pgrst" channel
25/Oct/2026:20:14:35 +0000: Successfully connected to PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
25/Oct/2026:20:14:35 +0000: Connection Pool initialized with a maximum size of 10 connections
25/Oct/2026:20:14:35 +0000: Config reloaded
25/Oct/2026:20:14:35 +0000: Failed to load the schema cache using db-schemas=graphql_public,identity,catalog,directory,config,booking,billing,verification,community,support,notify,audit,analytics and db-extra-search-path=public,extensions. {"code":"3F000","details":null,"hint":null,"message":"schema \"identity\" does not exist"}
25/Oct/2026:20:14:35 +0000: API server listening on 0.0.0.0:3000
25/Oct/2026:20:14:36 +0000: Attempting to reconnect to the database in 1 seconds...
25/Oct/2026:20:14:36 +0000: Successfully connected to PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
25/Oct/2026:20:14:36 +0000: Connection Pool initialized with a maximum size of 10 connections
25/Oct/2026:20:14:36 +0000: Config reloaded
25/Oct/2026:20:14:36 +0000: Failed to load the schema cache using db-schemas=graphql_public,identity,catalog,directory,config,booking,billing,verification,community,support,notify,audit,analytics and db-extra-search-path=public,extensions. {"code":"3F000","details":null,"hint":null,"message":"schema \"identity\" does not exist"}
25/Oct/2026:20:14:38 +0000: Attempting to reconnect to the database in 2 seconds...
25/Oct/2026:20:14:38 +0000: Successfully connected to PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
25/Oct/2026:20:14:38 +0000: Connection Pool initialized with a maximum size of 10 connections
25/Oct/2026:20:14:38 +0000: Config reloaded
25/Oct/2026:20:14:38 +0000: Failed to load the schema cache using db-schemas=graphql_public,identity,catalog,directory,config,booking,billing,verification,community,support,notify,audit,analytics and db-extra-search-path=public,extensions. {"code":"3F000","details":null,"hint":null,"message":"schema \"identity\" does not exist"}
25/Oct/2026:20:14:42 +0000: Attempting to reconnect to the database in 4 seconds...
25/Oct/2026:20:14:42 +0000: Successfully connected to PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
25/Oct/2026:20:14:42 +0000: Connection Pool initialized with a maximum size of 10 connections
25/Oct/2026:20:14:42 +0000: Config reloaded
25/Oct/2026:20:14:42 +0000: Failed to load the schema cache using db-schemas=graphql_public,identity,catalog,directory,config,booking,billing,verification,community,support,notify,audit,analytics and db-extra-search-path=public,extensions. {"code":"3F000","details":null,"hint":null,"message":"schema \"identity\" does not exist"}
25/Oct/2026:20:14:50 +0000: Attempting to reconnect to the database in 8 seconds...
25/Oct/2026:20:14:50 +0000: Successfully connected to PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
25/Oct/2026:20:14:50 +0000: Connection Pool initialized with a maximum size of 10 connections
25/Oct/2026:20:14:50 +0000: Config reloaded
25/Oct/2026:20:14:50 +0000: Failed to load the schema cache using db-schemas=graphql_public,identity,catalog,directory,config,booking,billing,verification,community,support,notify,audit,analytics and db-extra-search-path=public,extensions. {"code":"3F000","details":null,"hint":null,"message":"schema \"identity\" does not exist"}
25/Oct/2026:20:15:06 +0000: Attempting to reconnect to the database in 16 seconds...
25/Oct/2026:20:15:06 +0000: Successfully connected to PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
25/Oct/2026:20:15:06 +0000: Connection Pool initialized with a maximum size of 10 connections
25/Oct/2026:20:15:06 +0000: Config reloaded
25/Oct/2026:20:15:06 +0000: Failed to load the schema cache using db-schemas=graphql_public,identity,catalog,directory,config,booking,billing,verification,community,support,notify,audit,analytics and db-extra-search-path=public,extensions. {"code":"3F000","details":null,"hint":null,"message":"schema \"identity\" does not exist"}
== 2/6 seis fases
a aplicar 0001-foundation.sql
a aplicar functions/10-util.sql
a aplicar functions/20-audit.sql
a aplicar functions/30-notify.sql
a aplicar functions/35-notify-kinds.sql
a aplicar functions/40-auth-helper.sql
a aplicar policies/30-notify.sql
a aplicar grants/00-reset.sql
a aplicar grants/10-foundation.sql
nada por aplicar em seed.
nada em schedule.
== 3/6 a comparação do catálogo detecta mudanças
== 4/6 fases reaplicáveis outra vez, catálogo igual
a aplicar functions/10-util.sql
a aplicar functions/20-audit.sql
a aplicar functions/30-notify.sql
a aplicar functions/35-notify-kinds.sql
a aplicar functions/40-auth-helper.sql
a aplicar policies/30-notify.sql
a aplicar grants/00-reset.sql
a aplicar grants/10-foundation.sql
nada em schedule.
aplicada 0001-foundation.sql
== 4b/6 uma migration aplicada que mudou é recusada
== 5/6 tipos gerados iguais aos do repositório
tipos escritos em /tmp/tmp.r2DiUiUuFg/database.ts
== 6/6 asserções
# 0001-foundation.sql
ok - every table in the project schemas and in public has RLS enabled
ok - every SECURITY DEFINER function has search_path = ''
ok - routines run only for service_role; authenticated runs only auth_helper; never PUBLIC or anon
ok - anon and authenticated have no table-level INSERT, UPDATE, DELETE or TRUNCATE
ok - the only column the session writes is notify.notifications.read_at
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
testes da base: 1 ficheiro(s), todos passaram.
db:verify passou.

real	1m12.509s
user	0m12.982s
sys	0m5.780s
```
`docker ps -a --filter name=supabase` no fim: 0 contentores.

### Ctrl+C a meio (`interrupt-test.py`)
```
SIGINT after '== 1/6' (last log line: 'Starting database...'): containers before=1, exit=-2, containers after=0 (docker ps -a --filter name=supabase), 2 s to stop
SIGINT after 'a aplicar functions' (last log line: 'a aplicar policies/30-notify.sql'): containers before=7, exit=-2, containers after=0 (docker ps -a --filter name=supabase), 4 s to stop
SIGINT after '== 6/6' (last log line: '# 0001-foundation.sql'): containers before=7, exit=-2, containers after=0 (docker ps -a --filter name=supabase), 4 s to stop
volumes left: 0
```

### Tipos que divergem (antes das correcções da revisão)
```
$ (read_at edited by hand in database.ts) pnpm db:verify
Creating Storage bucket: library
Creating Storage bucket: chat-attachments
Creating Storage bucket: site-content
supabase_rest_portal-dos-interpretes unexpected status 503
== 2/6 seis fases
nada em schedule.
== 3/6 a comparação do catálogo detecta mudanças
== 4/6 fases reaplicáveis outra vez, catálogo igual
nada em schedule.
aplicada 0001-foundation.sql
== 5/6 tipos gerados iguais aos do repositório
tipos escritos em /tmp/tmp.KOVc426OL8/database.ts
--- /home/user/monorepo-portal_dos_interprete-ts/packages/db-types/src/database.ts	2026-10-25 19:39:25.888184091 +0000
+++ /tmp/tmp.KOVc426OL8/database.ts	2026-10-25 19:40:32.702447157 +0000
@@ -301,7 +301,7 @@
                     "kind": string;
                     "link": string | null;
                     "payload": NonNullable<Json>;
-                    "read_at": string;
+                    "read_at": string | null;
                     "updated_at": string;
                 };
                 ComputedFields: never;
ERRO: packages/db-types/src/database.ts não corresponde à base; corre pnpm db:types com a base de pé e faz commit.
 ELIFECYCLE  Command failed with exit code 1.
exit=1
containers left: 0
```

### `migrate.sh` recusa (antes das correcções da revisão: o seed ainda era um ficheiro de `seed/`)
```
$ pnpm db:status
aplicada 0001-foundation.sql
$ bash packages/db/scripts/migrate.sh --seed --status
aplicada seed/0001-notify-kinds.sql
$ (append "-- edited" to 0001-foundation.sql) bash packages/db/scripts/migrate.sh
MUDOU    0001-foundation.sql — já foi aplicada e o ficheiro mudou. Uma migration aplicada não se edita: escreve uma nova.
ERRO: 1 ficheiro(s) aplicado(s) não batem certo com o registo; nada foi aplicado.
exit=1
$ (seed file removed) bash packages/db/scripts/migrate.sh --seed
FALTA    seed/0001-notify-kinds.sql — está registada como aplicada mas o ficheiro desapareceu.
ERRO: 1 ficheiro(s) aplicado(s) não batem certo com o registo; nada foi aplicado.
exit=1
$ (files restored) bash packages/db/scripts/migrate.sh
nada por aplicar em migrations.
exit=0
$ (0002-probe.sql fails half-way) bash packages/db/scripts/migrate.sh
a aplicar 0002-probe.sql
psql:<stdin>:3: ERROR:  division by zero
ERRO: 0002-probe.sql falhou; nada dela ficou aplicado.
exit=1
t|t
$ (0003-probe.sql has no BEGIN/COMMIT) bash packages/db/scripts/migrate.sh
ERRO: 0003-probe.sql tem de abrir com BEGIN; e fechar com COMMIT;
exit=1
```
(Esta prova corre agora sozinha dentro do `db:verify`, passo 4b.)

### Asserções que falham quando devem
Doze mutações aplicadas antes das asserções, numa transacção desfeita; onze apanhadas com o nome da asserção (a décima segunda era um erro de sintaxe meu, não conta): gatilho da auditoria apagado, RLS desligado, tabela em `public`, INSERT concedido, coluna `kind` concedida, `search_path` removido, procedimento para `anon`, `notify.enqueue` para `anon`, índice de FK apagado, relógio concedido, domínio do link sem verificação.

### Portões do workspace
```
$ pnpm lint
 Tasks:    15 successful, 15 total
$ pnpm typecheck
 Tasks:    15 successful, 15 total
$ pnpm test
@portal-dos-interpretes/core:test:       Tests  24 passed (24)
@portal-dos-interpretes/db-types:test:       Tests  2 passed (2)
@portal-dos-interpretes/i18n:test:       Tests  11 passed (11)
@portal-dos-interpretes/db:test:       Tests  3 passed (3)
@portal-dos-interpretes/data:test:       Tests  20 passed (20)
@portal-dos-interpretes/ui:test:       Tests  11 passed (11)
@portal-dos-interpretes/auth:test:       Tests  20 passed (20)
@portal-dos-interpretes/features:test:       Tests  3 passed (3)
@portal-dos-interpretes/api:test:       Tests  4 passed (4)
@portal-dos-interpretes/site-web:test:       Tests  5 passed (5)
@portal-dos-interpretes/interpreter-web:test:       Tests  33 passed (33)
@portal-dos-interpretes/requester-web:test:       Tests  14 passed (14)
@portal-dos-interpretes/admin-web:test:       Tests  25 passed (25)
 Tasks:    14 successful, 14 total
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

verify.py: 16/16 checks passed
$ python3 scripts/verify.py --self-test
self-test: 16/16 checks behave
```

## Revisão independente
11 achados, nenhum alto. Corrigidos:
1. **Tabela em `public` aberta a `anon`** (CONFIRMADO): `public` fora da API, `auto_expose_new_tables = false`, RLS de `public` nas asserções, `DISABLE ROW LEVEL SECURITY` recusado pelo `verify.py`.
2. **`rule-clock` deixava passar** corpos entre plicas, `pg_catalog.now()`, `current_date`, `LOCALTIMESTAMP`, `'now'` (CONFIRMADO): todos apanhados; `identity` e `support` também (AD-025).
3. **O catálogo de avisos não se podia actualizar** numa base já criada (CONFIRMADO): passou para a fase reaplicável, com remoção dos que saem.
4. **O relógio de teste podia ser mudado por qualquer papel** e falsificava a hora da auditoria (CONFIRMADO): tabela `util.test_clock` só do dono; `audit.record` grava a hora real.
5. **Link para fora do site** (`//evil.example`) aceite (CONFIRMADO): domínio `util.relative_link`.
6. **"Nasce fechado" com buracos** (procedimentos, outros papéis, concessões por coluna, transacções separadas) (CONFIRMADO): reset por `aclexplode` a todos os papéis e a todo o tipo de rotina, asserção das concessões por coluna, fase numa só transacção.
7. **A fotografia do catálogo não via** dados, `storage`, `cron.job` completo (CONFIRMADO): acrescentados.
8. **Scripts** (PLAUSÍVEL, corrigido): espera por serviços com `docker ps -a`, `PROJECT_ID` lido do `config.toml`, segundo Ctrl+C e SIGHUP ignorados durante a limpeza, erros do `gen types` visíveis, pastas temporárias apagadas, registo da migration na mesma transacção.
9. **Divergências e testes em falta** (CONFIRMADO): `db:test` retirado (os testes correm no `db:verify`, instância temporária); recusa de migration alterada provada pelo próprio `db:verify`; testes novos para `service_role` não escrever avisos, `anon` não os ler, FK do tipo de aviso, dois prefixos no `next_code`.
10. **A mesma regra em vários sítios** (CONFIRMADO): `util.project_schemas()` e a verificação `schema-lists`; o email passou a domínio comparado com `EMAIL_PATTERN`.
11. **`next_code` em série; email não confirmado** (PLAUSÍVEL): registados em AD-025, sem mudança.

Antes da revisão, dois defeitos de `SIGPIPE` com `set -o pipefail` (`docker ps | grep -q` e `grep | head -1`) foram apanhados pela prova do Ctrl+C e corrigidos.

## O que não foi verificado
- O comportamento noutra máquina (Mac/Windows com Docker Desktop): só corri nesta VM Linux.
- `reset-local.sh` deixa a base apagada no fim (AD-025, por confirmar).
- A migration `0001` foi corrigida no próprio ficheiro depois da revisão: nunca tinha sido aplicada fora de instâncias temporárias nem enviada.
