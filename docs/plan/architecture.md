# Arquitectura — Portal dos Intérpretes

> Como o sistema se divide, onde vive cada coisa e porquê. As decisões de produto estão em `decisions.md`; as tabelas em `data-model.md`; as rotas da API em `api.md`.

---

## 1. Visão de conjunto

```
                 ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  ┌────────────┐
  Hostinger      │   site-web   │  │ requester-web │  │ interpreter-web │  │ admin-web  │
  (estático)     │  (público)   │  │ (solicitantes)│  │  (intérpretes)  │  │  (equipa)  │
                 └──────┬───────┘  └──────┬────────┘  └────────┬────────┘  └─────┬──────┘
                        │ anon            │ sessão             │ sessão          │ sessão
                        ▼                 ▼                    ▼                 ▼
                 ┌─────────────────────────────────────────────────────────────────────┐
                 │  Supabase: Postgres + RLS + Auth + Storage + pg_cron                 │
                 │  leituras com RLS, escritas simples do próprio por concessão de coluna│
                 └─────────────────────────────────────────────────────────────────────┘
                        ▲
                        │ service_role (só no servidor)
                 ┌──────┴──────────┐
  Railway        │   apps/api      │  Fastify: transições de estado, dinheiro, acções da
  (Dockerfile)   │                 │  equipa, ficheiros privados, emails, exportações
                 └─────────────────┘
```

**A regra que decide onde vai uma escrita** (ADR-003):

- **Directo à base, com RLS e concessão de coluna:** o que é do próprio e não tem consequência para mais ninguém. Exemplos: o texto da biografia, a disponibilidade, a formação, um post no fórum, marcar uma notificação como lida.
- **Pela API:** tudo o que muda o estado de um pedido, mexe em dinheiro, decide permissões, envolve outra pessoa, ou precisa da chave de serviço. Exemplos: aceitar um pedido, validar um comprovativo, suspender uma conta, publicar uma versão de configuração.

**A regra de negócio vive na base de dados**, numa função SQL. A API é a porta: autentica, valida a forma do pedido, chama a função, regista na auditoria, traduz erros. Nunca reimplementa a regra.

---

## 2. Monorepo

**pnpm + Turborepo.** Node ≥ 22. Nome dos pacotes: `@portal-dos-interpretes/<nome>`.

```
portal-dos-interpretes/
├── apps/
│   ├── site-web/          público, sem sessão obrigatória
│   ├── requester-web/     solicitantes (particulares e organizações)
│   ├── interpreter-web/   intérpretes
│   ├── admin-web/         equipa da plataforma
│   └── api/               Fastify
├── packages/
│   ├── config/            ESLint, tsconfig base, Vite base, Tailwind preset
│   ├── ui/                design system: tokens, primitivos shadcn, padrões sem domínio
│   ├── i18n/              textos pt-AO, formatação de kwanzas, datas e horas de Luanda
│   ├── core/              validações puras (telefone, NIF, email) e esquemas zod de formulários
│   ├── auth/              cliente Supabase, sessão partilhada, guardas, páginas de entrada
│   ├── data/              camada de dados: DAO → UseCase → ViewModel
│   ├── features/          ecrãs com domínio partilhados por mais de uma app
│   ├── db/                schema executável: migrations, functions, policies, seed, schedule, scripts, testes
│   └── db-types/          tipos gerados da base aplicada
├── docs/
├── supabase/config.toml   Supabase local (o schema vive em packages/db, não em supabase/migrations)
├── turbo.json, pnpm-workspace.yaml, package.json, .env.example
├── CLAUDE.md, HANDOFF.md, CHANGELOG.md
└── .githooks/pre-push
```

### Regra de dependências

```
site-web ─────────► ui, i18n, core, config, db-types, data (só leituras anónimas), auth (só para saber se há sessão)
requester-web ┐
interpreter-web ├─► ui, i18n, core, config, db-types, data, auth, features
admin-web ────┘
api ───────────────► core, i18n, db-types, config

features ──► ui, data, i18n, core
data ──────► db-types, core
auth ──────► ui, i18n, db-types
core ──────► (nada além de zod)
ui ────────► (nada além de React, Radix, Tailwind, Lucide)
```

1. **Nenhuma app importa de outra app.** O que duas apps usam sobe para `packages/`.
2. **`ui` não conhece o domínio.** Recebe props, nunca entidades.
3. **`features`** é o sítio para ecrãs com domínio usados por mais de uma app: o perfil público do intérprete, o chat do pedido, o feed, as notificações, o centro de suporte.
4. **Nenhum componente chama o Supabase nem o `fetch` directamente.** Só a pasta `packages/data/src/dao/` fala com o Supabase e com a API. Verificado por `no-restricted-imports` no ESLint.

---

## 3. Mapa das rotas: de hoje para as apps novas

Hoje há uma só SPA (`src/routes/*.tsx`). Na migração (passo D do plano) **cada ecrã muda de sítio, não se refaz**. Os caminhos ficam em inglês e sem o prefixo `/dashboard/<papel>`, porque cada app já é de um papel.

### `site-web`

| Rota de hoje                                                               | Rota nova                     | Nota                                                                                                                                                |
| -------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` → `/home`                                                              | `/`                           |                                                                                                                                                     |
| `/home`                                                                    | `/`                           |                                                                                                                                                     |
| `/services`                                                                | `/services`                   |                                                                                                                                                     |
| `/how-it-works`                                                            | `/how-it-works`               |                                                                                                                                                     |
| `/impact`                                                                  | `/impact`                     |                                                                                                                                                     |
| `/contact`                                                                 | `/contact`                    | formulário real (`specs/support.md`)                                                                                                                |
| `/for-requesters`                                                          | `/for-requesters`             |                                                                                                                                                     |
| `/for-interpreters`                                                        | `/for-interpreters`           |                                                                                                                                                     |
| `/interpreters`                                                            | `/interpreters`               | lista pública (`D-05`)                                                                                                                              |
| `/tutorials`                                                               | `/tutorials`                  |                                                                                                                                                     |
| `/interpreters/:slug` (e `/videos`, `/articles`, `/articles/:articleSlug`) | **sai do site**               | passa para `requester-web` e `interpreter-web` por `features` (`D-05`). No site, o cartão leva a `requester-web/login?returnTo=/interpreters/:slug` |
| `/login`, `/register`, `/recover-password`                                 | **sai do site**               | as páginas de entrada vivem em `packages/auth`; o site só tem links                                                                                 |
| `NotFound`                                                                 | `*` → página 404 em português | hoje inalcançável (inventário, `04-gaps.md` item 29)                                                                                                |

### `requester-web`

| Rota de hoje           | Rota nova                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard/requester` | `/`                                                                                                                                    |
| `…/requests`           | `/requests`                                                                                                                            |
| `…/requests/new`       | `/requests/new`                                                                                                                        |
| `…/requests/:id`       | `/requests/:id`                                                                                                                        |
| `…/interpreters`       | `/interpreters`                                                                                                                        |
| `…/favorites`          | `/favorites`                                                                                                                           |
| `…/history`            | `/history`                                                                                                                             |
| `…/reviews`            | `/reviews`                                                                                                                             |
| `…/profile`            | `/profile`                                                                                                                             |
| `…/settings`           | `/settings`                                                                                                                            |
| (novo)                 | `/interpreters/:slug`, `/interpreters/:slug/videos`, `/interpreters/:slug/articles`, `/interpreters/:slug/articles/:articleSlug`       |
| (novo)                 | `/organization`, `/organization/members`, `/organization/approvals`, `/organization/opportunities`                                     |
| (novo)                 | `/payments`, `/feed`, `/events`, `/support`, `/notifications`                                                                          |
| (novo)                 | `/login`, `/register`, `/recover-password`, `/reset-password`, `/verify-email`, `/accept-terms`, `/invite/:token` (de `packages/auth`) |

### `interpreter-web`

| Rota de hoje                     | Rota nova                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard/interpreter`         | `/`                                                                                                                                                           |
| `…/requests`                     | `/requests`                                                                                                                                                   |
| `…/open-requests`                | `/open-requests`                                                                                                                                              |
| `…/requests/:id`                 | `/requests/:id`                                                                                                                                               |
| `…/schedule`                     | `/schedule`                                                                                                                                                   |
| `…/availability`                 | `/availability`                                                                                                                                               |
| `…/earnings`                     | `/earnings`                                                                                                                                                   |
| `…/reviews`                      | `/reviews`                                                                                                                                                    |
| `…/profile` e as 6 sub-rotas     | `/profile`, `/profile/overview`, `/profile/experience`, `/profile/services`, `/profile/content`, `/profile/reviews`, `/profile/contact`                       |
| `…/verification` e `…/documents` | `/verification` (os documentos fazem parte do pedido de verificação)                                                                                          |
| `…/settings`                     | `/settings` (inclui os dados para receber repasses)                                                                                                           |
| `…/opportunities` (placeholder)  | `/opportunities`                                                                                                                                              |
| `…/events` (placeholder)         | `/events`                                                                                                                                                     |
| `…/legal` (placeholder)          | `/library/legal`                                                                                                                                              |
| (novo)                           | `/library`, `/training`, `/mentorship`, `/community/forum`, `/community/feed`, `/benefits`, `/support`, `/notifications`, `/interpreters/:slug` (ver colegas) |

### `admin-web`

| Rota de hoje                                                                       | Rota nova                                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard/admin`                                                                 | `/`                                                                                                                                                                                 |
| `…/interpreters`, `…/interpreters/:id`                                             | `/interpreters`, `/interpreters/:id`                                                                                                                                                |
| `…/interpreter-verifications`, `…/verification-requests`, `…/verification-history` | `/verifications` (fila), `/verifications/:id`, `/verifications/history`                                                                                                             |
| `…/requesters`, `…/requesters/:id`                                                 | `/requesters`, `/requesters/:id`, `/organizations`, `/organizations/:id`                                                                                                            |
| `…/requests`, `…/requests/:id`                                                     | `/requests`, `/requests/:id`, `/requests/managed` (fila do gerido)                                                                                                                  |
| `…/payments`                                                                       | `/payments` (comprovativos), `/payouts`, `/refunds`                                                                                                                                 |
| `…/services`                                                                       | `/catalog/services`, `/catalog/languages`, `/catalog/specialties`                                                                                                                   |
| `…/testimonials`, `…/success-cases`                                                | `/content/testimonials`, `/content/success-cases`, `/content/tutorials`, `/content/lga-videos`, `/content/reports` (denúncias)                                                      |
| `…/reports`                                                                        | `/reports`                                                                                                                                                                          |
| `…/settings`                                                                       | `/settings/config`, `/settings/legal`, `/settings/document-types`                                                                                                                   |
| `…/team`                                                                           | `/team`                                                                                                                                                                             |
| `…/audit`                                                                          | `/audit`                                                                                                                                                                            |
| `…/modules/*` (10 placeholders)                                                    | `/community/opportunities`, `/community/events`, `/community/training`, `/community/mentorship`, `/community/library`, `/community/forum`, `/community/feed`, `/community/partners` |
| `…/modules/support`                                                                | `/support/tickets`, `/support/contact-messages`                                                                                                                                     |
| (novo)                                                                             | `/exports`, `/login`, `/notifications/emails` (emails falhados)                                                                                                                     |

---

## 4. Sessão e papéis

- **Um só Supabase Auth** para as quatro apps. A sessão é guardada num **cookie no domínio-pai** (adaptador de storage do `supabase-js` em `packages/auth`), para atravessar os subdomínios. Em desenvolvimento, as apps correm em `localhost` com portas diferentes, e os cookies de `localhost` são partilhados entre portas.
- **O papel resolve-se no login**, nunca se pergunta: `requester` se existe `identity.requester_profiles` ou a pessoa pertence a uma organização; `interpreter` se existe `identity.interpreter_profiles`; `staff` se existe `identity.staff_members` activo. Quem tem os dois papéis entra no último usado (`identity.profiles.last_active_role`) e troca no cabeçalho.
- **Guardas de rota** em `packages/auth`: `RequireSession`, `RequireRole(role)`, `RequireStaffLevel(levels)`. Uma rota protegida sem sessão vai para `/login?returnTo=<rota>`; depois de entrar volta lá (`D-05`).
- **Os guardas são experiência, não segurança.** A segurança real é a RLS e a API.
- **Conta suspensa ou anonimizada:** o login é recusado pela API de sessão (`GET /me` devolve `ACCOUNT_SUSPENDED`), e a RLS nega tudo a quem não está activo (`auth_helper.is_active()`).

---

## 5. Base de dados

- **Supabase local em Docker** durante esta corrida (`D-85`). A CLI do Supabase é dependência de desenvolvimento do projecto (`supabase` no `package.json` da raiz), não instalada no sistema.
- **Schemas por domínio:** `identity`, `catalog`, `directory`, `config`, `booking`, `billing`, `verification`, `community`, `support`, `notify`, `audit`, `analytics` (só funções de relatório), `util`, `auth_helper`. Expostos ao PostgREST pela lista em `supabase/config.toml`.
- **`packages/db/` aplica-se em seis fases, por esta ordem:** `migrations/` (imutáveis, numeradas) → `functions/` (reaplicáveis) → `policies/` (reaplicáveis) → `grants/` (reaplicáveis; concessões por coluna) → `seed/` (não reaplicável) → `schedule/` (pg_cron; sempre a última, porque uma tarefa começa a correr assim que é registada).
- **Registo de migrations** em `util.applied_migrations` (nome, sha256, aplicada em, `marked_only`). O executor `packages/db/scripts/migrate.sh` aplica só as que faltam e **recusa** correr se o sha256 de uma já aplicada mudou.
- **Toda a migration abre com `BEGIN;` e fecha com `COMMIT;`.**
- **Nasce fechado:** `authenticated` não tem `INSERT` nem `UPDATE` ao nível da tabela; as escritas directas vêm de `GRANT INSERT/UPDATE (colunas)` só onde a app escreve de facto. Uma coluna com consequência (estado, dinheiro, `verified`, datas de decisão) **nunca** se concede: escreve-a uma função `SECURITY DEFINER` chamada pela API.
- **Funções `SECURITY DEFINER`** têm `SET search_path = ''` e nomes totalmente qualificados. As que mudam estado têm `EXECUTE` só para `service_role`; a API chama-as com o id da conta resolvido do JWT, nunca vindo do corpo do pedido.
- **Tipos gerados** em `packages/db-types` a partir da base aplicada (`supabase gen types` com a lista de schemas). Nunca editados à mão.
- **`pnpm db:verify`** levanta uma base limpa, aplica as seis fases, reaplica as reaplicáveis e compara o catálogo, regenera os tipos e falha se divergirem, e corre as asserções em `packages/db/tests/`.

### Storage

| Bucket              | Público? | Quem escreve                                    | Quem lê                                           |
| ------------------- | -------- | ----------------------------------------------- | ------------------------------------------------- |
| `avatars`           | sim      | o próprio                                       | todos                                             |
| `interpreter-media` | sim      | o intérprete dono                               | todos com conta (as imagens; os vídeos são links) |
| `feed-images`       | sim      | o intérprete autor                              | todos com conta                                   |
| `payment-proofs`    | **não**  | o pagador, por URL assinado emitido pela API    | o próprio e `finance`/`super_admin`               |
| `verification-docs` | **não**  | o intérprete, por URL assinado emitido pela API | o próprio e `moderator`/`super_admin`             |
| `library`           | não      | `moderator`/`super_admin`                       | intérpretes com conta                             |
| `chat-attachments`  | **não**  | participantes do pedido, por URL assinado       | participantes e equipa (com auditoria, `D-58`)    |
| `site-content`      | sim      | `moderator`/`super_admin`                       | todos                                             |

Limites por bucket (tamanho e tipos MIME) em `supabase/config.toml` e no `packages/db/storage/`.

### Tarefas agendadas (pg_cron)

Todas chamam uma função SQL que é a dona da regra. Lista e frequência em `data-model.md` §12.

---

## 6. API (Fastify)

```
apps/api/src/
├── server.ts           registo de plugins e rotas, /health
├── config/env.ts       variáveis validadas com zod no arranque
├── plugins/            auth (JWT → conta), staff (nível), audit, rateLimit, errors
├── routes/             por domínio, espelhando os schemas
├── lib/                sendApiError, dbError → ApiError, signedUrls, pagination
├── jobs/               email outbox worker
└── integrations/       email (adaptador: local/Inbucket em dev, fornecedor em produção)
```

- **A conta vem sempre do JWT.** Nenhuma rota aceita um `account_id` de quem chama para agir em seu nome.
- **Erros com dois níveis:** `code` estável em inglês e, nos erros de negócio, `message` em português e `field` do formulário. Um erro desconhecido da base dá `INTERNAL_ERROR` com frase genérica; o texto real vai para o log. Catálogo único em `api.md` §2; no código vive **só** em `@portal-dos-interpretes/core/errors` (código, mensagem, campo), que a API e as apps importam. Uma função SQL levanta `P0001` com o código do catálogo na mensagem; a API traduz pelo mesmo módulo.
- **Auditoria:** o plugin `audit` regista cada acção da equipa, cada exportação e cada leitura de conversa pela equipa. As transições de estado são registadas pela própria função SQL.
- **`GET /health`** devolve `status`, `version`, `commit` e `migration_in_database` comparado com `migration_in_build` (`api.md` §3).
- **Limites de pedidos** por IP e por conta nas rotas públicas (formulário de contacto, registo) e nas que criam coisas (pedidos, propostas, comprovativos).
- **Deploy:** Dockerfile explícito para o monorepo (`FP-04`); `host 0.0.0.0`.

---

## 7. Camada de dados nas apps — Clean Architecture + MVVM

Segue a skill `clean-architecture-mvvm-data-layer`, variante Supabase + Fastify.

```
packages/data/src/
├── config/          cliente Supabase único (chave anon), cliente da API
├── domain/
│   ├── entities/    Row + relações resolvidas
│   ├── errors/      tipos de erro de domínio; as mensagens vêm de @portal-dos-interpretes/core/errors, nunca daqui
│   └── usecases/    regras que o cliente pode conhecer, orquestração, Row → Entity
├── interfaces/      os Ports (I<Coisa>Repository)
└── dao/
    ├── supabase/    BaseSupabaseDAO (multi-schema), ReadOnlyDAO, um DAO por tabela/vista
    └── api/         ApiClient: chama apps/api com o JWT da sessão
```

- **ViewModels** vivem em cada app (`apps/<app>/src/viewModels/`), ou em `packages/features` quando o ecrã é partilhado. Devolvem sempre `{ data, isLoading, error, actions }`.
- **Sem optimistic update** em nada que mude estado de pedido ou dinheiro.
- **Realtime** só onde alguém está a olhar à espera: chat do pedido, estado do pedido aberto em modo "o primeiro que aceitar", notificações. Toda a subscrição devolve `unsubscribe`. `schema: this.schemaName`, nunca `'public'` fixo.
- **O código da camada de dados actual** (`src/modules/Api/supabase/*DAO.ts`, `src/domain/usecases`, `src/viewModels`) **não se migra**: foi escrito contra um schema que deixa de existir. Os ecrãs migram com os mocks (passo D) e ligam-se à camada nova passo a passo (H…).

---

## 8. Alojamento

- **Apps web na Hostinger** (`D-81`): build estático por app, num subdomínio cada. Cada app leva um `.htaccess` em `public/` com o rewrite de SPA para `index.html`, para os URLs profundos não darem 404.
- **API no Railway**, com Dockerfile.
- **Supabase de produção:** projecto novo, fora desta corrida (`FP-04`).
- Domínios por decidir (`PC-09`). Nomes provisórios nas variáveis de ambiente: `SITE_URL`, `REQUESTER_URL`, `INTERPRETER_URL`, `ADMIN_URL`, `API_URL`.

---

## 9. Versões

- **Uma só versão para todo o monorepo**: a raiz, as apps e os pacotes têm o mesmo número.
- **`0.MINOR.PATCH`**: cada passo do `MASTER-PLAN.md` fecha com um MINOR novo e uma tag anotada. As correcções dentro de um passo já fechado são PATCH. `1.0.0` é o primeiro lançamento com utilizadores reais.
- `CHANGELOG.md` e `HANDOFF.md` desde o primeiro commit.
- Em runtime, cada app mostra a versão e o commit no rodapé ou nas definições.

---

## 10. ADRs a criar em `docs/decisions/`

Curtos: contexto, decisão, consequências. O passo C cria os ficheiros a partir daqui.

**ADR-001 — Monorepo pnpm + Turborepo.** _Contexto:_ quatro apps e uma API sobre a mesma base, com tipos e componentes partilhados. _Decisão:_ monorepo pnpm + Turborepo. _Consequências:_ um só lockfile; os pacotes partilhados não se publicam; o CI e o hook local correm em todo o repositório.

**ADR-002 — Uma app por público.** _Contexto:_ hoje uma SPA com quatro públicos e nenhum guarda de rota. _Decisão:_ `site-web`, `requester-web`, `interpreter-web`, `admin-web`. _Consequências:_ quem tem dois papéis salta entre duas apps (sessão partilhada por cookie); ecrãs comuns vivem em `packages/features`.

**ADR-003 — A regra vive na base; a API é a porta do sensível.** _Contexto:_ o inventário mostrou uma camada de dados que deixava o browser escrever tudo. _Decisão:_ regras de negócio em funções SQL; escritas com estado, dinheiro ou outra pessoa passam pela API com `service_role`; o cliente só escreve o que é seu, por concessão de coluna. _Consequências:_ mais rotas na API; uma regra tem um só sítio.

**ADR-004 — Schema recomeçado de raiz.** _Contexto:_ o `database_schema.sql` antigo nunca correu de uma só vez, não tem RLS nem migrations, e diverge do código em 18 pontos (inventário). _Decisão:_ o schema é desenhado de novo em `packages/db`, a partir de `data-model.md`; a base remota antiga não é tocada. _Consequências:_ a camada de dados antiga não se migra; os ecrãs sim.

**ADR-005 — Pagamentos por comprovativo.** _Contexto:_ o Multicaixa Express exige homologação EMIS de semanas. _Decisão:_ transferência com comprovativo validado pela equipa, atrás de uma intenção de pagamento genérica, preparada para receber um gateway depois (`FP-03`). _Consequências:_ trabalho manual do financeiro; nenhum webhook nesta corrida.

**ADR-006 — Configuração versionada.** _Contexto:_ preços, prazos e percentagens mudam, e um pedido antigo tem de se explicar com os valores do seu dia. _Decisão:_ `config.platform_versions`, publicadas e imutáveis, com uma só em vigor; pedidos e pagamentos guardam a versão. _Consequências:_ mudar um valor é publicar uma versão nova; nada se edita no lugar.

**ADR-007 — Sessão partilhada por cookie.** _Contexto:_ quatro apps em subdomínios, e pessoas com dois papéis. _Decisão:_ storage do `supabase-js` num cookie do domínio-pai. _Consequências:_ um login serve todas as apps; o cookie tem de ser `Secure` e `SameSite=Lax` em produção.
