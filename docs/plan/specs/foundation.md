# Spec — Fundação (passos A a G)

> O que se faz antes da primeira funcionalidade: inventário, Git, monorepo, migração dos ecrãs, pacotes partilhados, base local e API. Nenhuma regra de negócio vive aqui; vivem nas specs das funcionalidades.

---

## A — Inventário só de leitura

**Objectivo:** confirmar o que o plano supõe sobre o código de hoje, antes de mexer em nada.

O inventário de 2026-10-15 já existe em `docs/inventory/` (00 a 04). Este passo **não o refaz**: lê-o, confirma-o contra o código e acrescenta o que falta.

1. Confirmar que o código bate com `docs/inventory/`. Divergências vão para `docs/plan/auto-decisions.md`.
2. **Mapa de rotas**: cada ficheiro de `src/pages/**` com a app nova a que pertence, segundo `architecture.md` §3. Escrever em `docs/inventory/05-route-map.md`. Uma página que não caiba em nenhuma linha do mapa é uma divergência a registar.
3. **Componentes partilhados**: que componentes de `src/components/` são usados por mais do que um público. São candidatos a `packages/ui` (sem domínio) ou `packages/features` (com domínio). Em `05-route-map.md`.
4. **Segredos no código**: procurar chaves, tokens e URLs privados em todos os ficheiros versionados e no histórico, **sem imprimir valores**. Já se sabe que o `.env` está versionado (inventário, item 11). Registar o que se encontrar.
5. **Mocks**: listar os ficheiros de `src/core/mocks/` e os dados escritos dentro das páginas; servem de base ao seed (`D-82`).
6. **Actualizar `docs/_source/product-explainer.md`**: a secção 8 ("O que ainda não está decidido") passa a apontar para `docs/plan/decisions.md`, com o código de cada decisão (`P1` → `D-01`, e assim por diante). O texto das secções 1 a 7 só muda onde contradiz uma decisão. A nota do topo passa a dizer que as regras estão em `docs/plan/specs/` e as decisões em `docs/plan/decisions.md`.

**Feito quando:** `05-route-map.md` existe e cobre todas as páginas; os segredos estão listados por nome; o explainer aponta para `decisions.md`.

**Não se faz:** nenhuma alteração ao código.

## B — Git do zero

**Objectivo:** um repositório novo, limpo de segredos, com o histórico antigo guardado num ficheiro.

1. `git bundle create ../grace-mind-connect-old-history.bundle --all`. Confirmar que o ficheiro existe e tem tamanho maior que zero; registar o tamanho no HANDOFF.
2. Remover o remoto antigo e apagar a pasta `.git`. **O repositório antigo no GitHub não se toca.**
3. `git init -b main`, depois criar `dev` e trabalhar em `dev`.
4. `.gitignore` com `.env`, `.env.*` (excepto `.env.example`), `node_modules/`, `dist/`, `.turbo/`, `coverage/`, `supabase/.temp/`, `supabase/.branches/`, `docs/technical/TEST-CREDENTIALS.md`, `*.bundle`, `.DS_Store`.
5. `.env.example` com os nomes das variáveis e valores vazios ou de exemplo.
6. `.gitattributes` com `* text=auto eol=lf`, para acabar com os 182 ficheiros que só diferem no fim de linha.
7. Se o passo A encontrou segredos em ficheiros que vão ser versionados, retirá-los **antes** do primeiro commit e registar em `auto-decisions.md`.
8. Actualizar o `CLAUDE.md`: as regras de Git passam a ser as de `docs/plan/claude-code-rules.md` (commit e push para `dev` sem pedir, quando houver remoto); acrescentar o apontador para `docs/plan/`.
9. Primeiro commit (inclui o que o passo A escreveu), `CHANGELOG.md` com a entrada `0.1.0`, tag `v0.1.0`.

**Feito quando:** `git log` tem o primeiro commit em `dev`; `git ls-files | grep -E '(^|/)\.env$'` não devolve nada; o bundle existe fora da pasta do projecto.

## C — Monorepo, vazio e a compilar

**Objectivo:** a estrutura de `architecture.md` §2, com as quatro apps e a API a arrancar vazias, sem tocar ainda no código de hoje.

1. `pnpm-workspace.yaml`, `turbo.json`, `package.json` da raiz com os scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `db:*`, `verify`), `tsconfig.base.json` **estrito** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), `packages/config` com ESLint (incluindo `no-restricted-imports` para o Supabase fora de `packages/data/src/dao`), Vite base e Tailwind preset.
2. As quatro apps com Vite + React 18 + TypeScript, cada uma com uma página "a arrancar" e a versão no rodapé. A API com `GET /health`.
3. Pacotes vazios com `index.ts` e `package.json`.
4. `scripts/verify.py`: as primeiras verificações estruturais (ver "Verificações estruturais" abaixo).
5. `.githooks/pre-push` com `lint`, `typecheck`, `test`, `python3 scripts/verify.py`, e `pnpm db:verify` quando o push toca em `packages/db/`. Activado por `core.hooksPath` no script `prepare`.
6. `docs/decisions/ADR-001.md` a `ADR-007.md`, a partir de `architecture.md` §10.
7. Dockerfile da API, explícito para o monorepo (`pnpm deploy --filter @portal/api`).

**Feito quando:** `pnpm install && pnpm build && pnpm typecheck && pnpm lint` passam; `pnpm dev` arranca as cinco; `curl localhost:<porta>/health` responde; `docker build -f apps/api/Dockerfile .` termina.

### Melhorias da execução (passo C, 2026-10-25)

Respostas dadas pelo Claude Code às perguntas da skill `brainstorming`, pelas regras de `claude-code-rules.md` §3. Nenhuma muda uma decisão.

- **Nome dos pacotes:** `@portal-dos-interpretes/<nome>`, como `architecture.md` §2; o `@portal/api` do `MASTER-PLAN.md` (passo G) lê-se como `@portal-dos-interpretes/api` (AD-007).
- **O código de hoje durante C–D:** a SPA antiga passa, sem mudar uma linha, para `legacy/` (pacote `@portal-dos-interpretes/legacy-spa` do workspace), para a raiz poder ser a raiz do monorepo. Continua a arrancar e a compilar como hoje, serve de comparação nos passos D, e apaga-se no D4 ("`src/` antigo apaga-se só quando a última app migrar"). As verificações estruturais e o ESLint estrito não se aplicam a `legacy/` (AD-008).
- **Versões das ferramentas:** as do código de hoje onde o código vai mudar de sítio (React 18, Vite 5, Tailwind 3, shadcn/ui), para "mover, não reescrever" ser possível; Fastify 5 e Vitest na API e nos pacotes; TypeScript 5.
- **Versão e commit no rodapé:** injectados pelo Vite (`__APP_VERSION__`, `__APP_COMMIT__`) a partir do `package.json` da raiz e de `git rev-parse --short HEAD`.
- **`verify.py` no passo C:** as quatro verificações "Desde C" (fetch/Supabase fora de `packages/data/src/dao/`, app a importar app, `.env` versionado, identificadores em inglês), cada uma com um ficheiro de violação deliberada em `scripts/fixtures/` que tem de apanhar (`verify.py --self-test`).
- **Portas:** AD-006. **Host do Vite:** AD-004.
- **`docker build`:** a imagem base `node:22-alpine` vem do Docker Hub, que nesta VM dá 429 intermitente; o passo tenta de novo e regista o resultado (`environment.md` §4).

## D — Mover o código app a app

**Objectivo:** os ecrãs de hoje a funcionar nas apps novas, **exactamente como funcionam hoje** (com mocks), antes de ligar qualquer dado real.

Uma app por subpasso, por esta ordem: `site-web`, `admin-web`, `requester-web`, `interpreter-web`. Em cada uma:

1. Mover as páginas e os componentes só dessa app segundo `05-route-map.md`. **Mover, não reescrever**: o JSX, os estilos e os mocks mudam de sítio.
2. Os componentes usados por mais de uma app ficam temporariamente copiados? **Não.** Sobem já para `packages/ui` (sem domínio) ou `packages/features` (com domínio), e as duas apps importam de lá.
3. As rotas seguem `architecture.md` §3. Os links internos entre apps (por exemplo, do site para o login) usam as variáveis `*_URL`.
4. O `NotFound` em português passa a ser alcançável (`*`).
5. Os erros de TypeScript que o modo estrito revela corrigem-se só no que foi movido; o que exigir mudança de comportamento regista-se e fica para o passo da funcionalidade.
6. `src/` antigo apaga-se só quando a última app migrar.

**Feito quando:** em cada app, todas as rotas do mapa abrem no browser sem erros de consola e mostram o mesmo que hoje; uma verificação percorre as rotas do mapa com Playwright e falha se alguma der erro ou ecrã em branco.

## E — Pacotes partilhados

**Objectivo:** extrair o que está repetido e criar as fundações que as funcionalidades vão usar.

- `packages/ui`: os primitivos shadcn, tokens de cor e tipo, padrões sem domínio (`EmptyState`, `StatusBadge` **com fallback** para estados desconhecidos, `Pagination`, `ConfirmDialog`, `FileUpload`, `MoneyAmount`). O `StatusBadge` de hoje rebenta com valores que não conhece (inventário, item 7); o novo mostra "Estado desconhecido" e regista um aviso.
- `packages/i18n`: `formatAoa` (`14 040 Kz`), datas e horas em `Africa/Luanda`, textos comuns.
- `packages/core`: `normalizePhone`, `PHONE_E164_PATTERN`, `NIF_PATTERN`, `IBAN_AO_PATTERN`, `EMAIL_PATTERN`, e os esquemas zod partilhados. Com testes.
- `packages/auth`: cliente Supabase com storage em cookie no domínio-pai (`ADR-007`), `useSession`, `RequireSession`, `RequireRole`, `RequireStaffLevel`, e as páginas de entrada (ainda ligadas a nada; ligam no passo H2).
- `packages/data`: `BaseSupabaseDAO` multi-schema, `ReadOnlyDAO`, `ApiClient` com tradução de erros por `code`, erros de domínio. Segue a skill `clean-architecture-mvvm-data-layer`.
- `packages/features`: os ecrãs com domínio partilhados que o passo D identificou.

**Feito quando:** nenhuma app tem uma cópia de um componente que existe num pacote (verificação em `verify.py`); os testes de `core` e `i18n` passam.

### Melhorias da execução (passo E, 2026-10-25)

- **Catálogo de erros:** gerado de `api.md` §2 para `packages/core/src/errors/catalog.ts` por `scripts/error_catalog.py`; `verify.py` (`error-catalog`) falha se divergirem. É o "um sítio só" de `architecture.md` §6; `apps/api/src/lib/dbErrors.ts` (passo G) traduz para estes códigos.
- **`formatAoa`:** separa os milhares e o "Kz" com espaço inquebrável, para "14 040 Kz" nunca partir a meio; recusa cêntimos (D-37).
- **`ui → i18n`** (AD-018) e **`auth → data, core`** (AD-019): registados na regra de dependências.
- **`packages/data`:** um só tipo de erro (`DataError`, com o código do catálogo); `P0001` com um código do catálogo passa; permissão negada é `FORBIDDEN`; o resto é `INTERNAL_ERROR`, com o texto real só no registo.
- **Componentes partilhados duplicados:** `verify.py` (`no-duplicated-component`) compara nomes e conteúdo entre as apps e `packages/ui`/`packages/features`.
- O `@import` da fonte no `styles.css` passou para o topo (antes era ignorado pelo browser).

## F — Base de dados local

**Objectivo:** a máquina que aplica, verifica e reconstrói a base, com o esqueleto comum. **As tabelas de cada funcionalidade entram no passo dela.**

1. `supabase` (CLI) como dependência de desenvolvimento da raiz. `supabase/config.toml` com os schemas de `architecture.md` §5 expostos, os buckets e o servidor de email local.
2. Scripts em `packages/db/scripts/`, todos com a verificação de disco de `claude-code-rules.md` §5; os de instância temporária (`verify.sh`, `reset-local.sh`, testes) também com o `trap` de limpeza:
   - `db-up.sh` / `db-down.sh` (instância de desenvolvimento, sem `trap`: `db-up` arranca e aplica o que falta; `db-down` pára e apaga contentores e volumes);
   - `migrate.sh` (aplica só as migrations que faltam; recusa se uma aplicada mudou; `--status`);
   - `apply.sh <fase>` para as fases reaplicáveis;
   - `verify.sh` (o `pnpm db:verify`);
   - `reset-local.sh` (apaga e reconstrói tudo, com seed);
   - `bootstrap-admin.mjs` (cria o primeiro `super_admin` e publica a primeira versão de configuração, `R-STF-03`; entra no passo H1, quando existem as tabelas da equipa e da configuração).
3. Migration `0001-foundation.sql`: schemas, extensões (`pgcrypto`, `citext`, `btree_gist`, `pg_cron`), `util` (domínios, `applied_migrations`, `set_updated_at`, `forbid_mutation`, `next_code`, `app_timezone`, `now()` substituível nos testes), `auth_helper` (as funções que já fazem sentido sem tabelas de domínio), `audit.events` + `audit.record`, `notify.kinds` + `notify.notifications` + `notify.email_outbox` + `notify.enqueue` + `notify.enqueue_email`, `ALTER DEFAULT PRIVILEGES` global a revogar `PUBLIC`.
4. `packages/db/tests/`: asserções em SQL, cada uma com nome, que correm contra a base viva. A primeira leva: nenhuma tabela sem RLS; `audit.events` recusa `UPDATE` e `DELETE` mesmo com `service_role`; toda a função `SECURITY DEFINER` tem `search_path` fixo.
5. `packages/db-types`: geração a partir da base aplicada; `db:verify` falha se o ficheiro commitado divergir.

**Feito quando:** `pnpm db:verify` passa de raiz; `reset-local.sh` reconstrói a base; parar o processo a meio com Ctrl+C deixa zero contentores do projecto (`docker ps -a --filter name=supabase`).

## G — API

**Objectivo:** a API pronta a receber rotas de funcionalidade.

1. `config/env.ts` com zod; arranque falha com mensagem clara se faltar uma variável.
2. Plugins: `auth` (JWT → conta; `ACCOUNT_SUSPENDED`; `TERMS_ACCEPTANCE_REQUIRED` excepto em `/me` e `/me/accept-terms`), `staff` (nível), `audit` (`audit.record` com `request_id` e IP), `rateLimit` (com `trustProxy` de profundidade fixa, nunca `true`), `errors`.
3. `lib/sendApiError.ts` e `lib/dbErrors.ts`: o catálogo de `api.md` §2, **um sítio só**. Um erro da base desconhecido dá `INTERNAL_ERROR`; o texto real vai para o log.
4. `GET /health` com `version`, `commit`, `migration_in_build`, `migration_in_database`.
5. Worker do email (`api.md` §15) com o adaptador local.
6. `POST /uploads/sign` e `GET /files/url`, com a autorização delegada em funções SQL por finalidade (vazias até cada passo as preencher).
7. Testes com `fastify.inject` contra a base local: autenticação, erros, health, worker do email.

**Feito quando:** os testes passam; um pedido sem token dá `401 UNAUTHENTICATED`; um erro forçado na base chega ao cliente como `INTERNAL_ERROR` sem texto técnico; um email enfileirado aparece no servidor de email local.

---

## Verificações estruturais (`scripts/verify.py`)

Começam no passo C e crescem em cada passo. Cada uma falha em voz alta, com o ficheiro e a linha.

| Verificação | Desde |
|---|---|
| Nenhum `supabase.from`, `supabase.rpc`, `supabase.storage` ou `fetch(` fora de `packages/data/src/dao/` | C |
| Nenhuma app importa de outra app | C |
| Nenhum `.env` versionado | C |
| Toda a migration nova abre com `BEGIN;` e fecha com `COMMIT;` | F |
| Toda a tabela tem `ENABLE ROW LEVEL SECURITY` | F |
| Toda a função `SECURITY DEFINER` tem `SET search_path` | F |
| Toda a FK tem índice | F |
| `NIF_PATTERN` e `PHONE_E164_PATTERN` em `@portal/core` são iguais às expressões de `util.nif` e `util.phone_e164` (`R-CFG-05`) | F |
| Nenhum ecrã soma imposto nem escreve uma percentagem: os totais vêm de `billing.split_amount` ou `booking.preview_request_total` | H5 |
| Nenhuma rota fixa um `field` ou uma `message` de erro fora de `dbErrors.ts`/`sendApiError.ts` | G |
| Toda a coluna que o código escreve com a sessão do utilizador está concedida em `packages/db/grants/` | H2 |
| Toda a exportação é de `super`/`fin` e passa pelo plugin de auditoria | H13 |
| Identificadores em inglês (lista de palavras portuguesas que não são também inglesas) | C |
