# 00 — Visão Geral (Fase 0: Reconhecimento)

**Projecto:** Portal dos Intérpretes (repo `grace-mind-connect`)
**Data do inventário:** 2026-10-14
**Natureza deste documento:** só leitura. Nada foi alterado, executado contra o remoto, nem commitado.

Convenção de marcas:
- **[VISTO]** — lido directamente no código/ficheiro, com caminho (e linha quando útil).
- **[INFERIDO]** — dedução a partir de evidência indirecta.
- **[DESCONHECIDO]** — não verificável com as fontes disponíveis nesta fase.

---

## 1. Estrutura do repositório

**Não é monorepo.** [VISTO] — `package.json` não tem chave `workspaces`; não existem `apps/`, `packages/`, `turbo.json`, `pnpm-workspace.yaml` nem `lerna.json`. É uma única aplicação SPA na raiz.

Topo do repositório [VISTO] (`ls -la` na raiz):

```
.agent/              # Config de ferramentas de IA ("Antigravity Kit") — não faz parte do runtime
.env                 # ATENÇÃO: está versionado no git (ver §7)
public/              # favicon.ico, robots.txt, placeholder.svg
src/                 # toda a aplicação
supabase/            # 3 ficheiros .sql soltos (ver §4)
bun.lockb            # lockfile Bun
package-lock.json    # lockfile npm
index.html
vite.config.ts  tailwind.config.ts  postcss.config.js  eslint.config.js
tsconfig.json  tsconfig.app.json  tsconfig.node.json
components.json      # config shadcn/ui
README.md
```

Nota: `.agent/ARCHITECTURE.md:1` é documentação do "Antigravity Kit" (toolkit de agentes de IA), não deste projecto. Não há nenhuma documentação técnica prévia do Portal para além do `README.md`. [VISTO]

### Estrutura de `src/` [VISTO]

395 ficheiros `.ts`/`.tsx` no total. [VISTO] (`find src -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l`)

| Pasta | Ficheiros | Papel [INFERIDO pelos nomes e conteúdo amostrado] |
|---|---|---|
| `src/components/ui` | 49 | primitivos shadcn/ui |
| `src/modules/Api/supabase` | 38 | DAOs Supabase (um por entidade) |
| `src/core/interfaces` | 38 | interfaces de repositório (`I*Repository`) |
| `src/viewModels` | 37 | hooks React Query por entidade |
| `src/domain/usecases` | 37 | casos de uso (passagem fina para os repositórios) |
| `src/pages/dashboard/admin` | 19 | ecrãs do dashboard admin |
| `src/components/dashboard/modals` | 19 | modais do dashboard |
| `src/pages/portal` | 13 | ecrãs do portal público |
| `src/pages/dashboard/interpreter` | 13 | ecrãs do dashboard intérprete |
| `src/pages/dashboard/requester` | 11 | ecrãs do dashboard solicitante |
| `src/core/entities/*` | 29 (8 subpastas) | entidades por domínio: `base`, `booking`, `content`, `financial`, `identity`, `interpreter`, `platform`, `system` |
| `src/core/mocks` | 6 | dados mock centralizados |
| `src/routes` | 5 | definição de rotas |
| `src/type/database`, `src/type/enum` | 8 + 7 | tipos e enums |
| `src/modules/Api/rest` | 3 | **praticamente vazio** — `api.server.ts` e `users.dao.ts` têm 0 bytes [VISTO] |
| `src/modules/Api/firebase` | 0 | **pasta vazia** [VISTO] |

**Arquitectura declarada:** camadas tipo clean architecture / DDD — `core/entities` → `core/interfaces` → `modules/Api/*` (DAOs) → `domain/usecases` → `viewModels` (React Query) → `pages`. [VISTO] em `src/modules/Api/index.ts:1-80` (registo das interfaces e DAOs) e nas mensagens de commit `fecc12c`, `7026ebe`, `98b0bd1`.

---

## 2. Stack e versões [VISTO] (`package.json`)

| Camada | Tecnologia e versão declarada |
|---|---|
| Nome do pacote | `vite_react_shadcn_ts`, `version: 0.0.0`, `private: true`, `type: module` |
| Runtime UI | `react ^18.3.1`, `react-dom ^18.3.1` |
| Build | `vite ^5.4.19`, `@vitejs/plugin-react-swc ^3.11.0` |
| Linguagem | `typescript ^5.8.3` |
| Routing | `react-router-dom ^6.30.1` |
| Dados | `@tanstack/react-query ^5.83.0` |
| Backend SDK | `@supabase/supabase-js ^2.100.0` |
| Styling | `tailwindcss ^3.4.17`, `tailwindcss-animate ^1.0.7`, `@tailwindcss/typography ^0.5.16` |
| UI kit | 27 pacotes `@radix-ui/react-*` (base shadcn/ui), `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `tailwind-merge ^2.6.0` |
| Forms | `react-hook-form ^7.61.1`, `zod ^3.25.76`, `@hookform/resolvers ^3.10.0` |
| Gráficos | `recharts ^2.15.4` |
| Ícones | `lucide-react ^0.462.0` |
| Toasts | `sonner ^1.7.4` + toaster shadcn (`@radix-ui/react-toast`) |
| Tema | `next-themes ^0.3.0` |
| Outros UI | `embla-carousel-react ^8.6.0`, `cmdk ^1.1.1`, `vaul ^0.9.9`, `input-otp ^1.4.2`, `react-day-picker ^8.10.1`, `react-resizable-panels ^2.1.9`, `date-fns ^3.6.0` |
| Lint | `eslint ^9.32.0`, `typescript-eslint ^8.38.0`, `eslint-plugin-react-hooks ^5.2.0`, `eslint-plugin-react-refresh ^0.4.20` |
| Origem | `lovable-tagger ^1.1.13` em devDependencies, usado em `vite.config.ts:4,10` → projecto iniciado em Lovable [INFERIDO] |

**Nota sobre o tipo de projecto:** o ambiente desta sessão reportou `frameworks: ["nextjs","react"]`. **Isso está errado** — não existe Next.js no projecto. É Vite + React SPA. [VISTO] `package.json` (sem `next`), `vite.config.ts`, `index.html:46` (`<script type="module" src="/src/main.tsx">`). O pacote `next-themes` é só a biblioteca de tema, não implica Next.js.

### Scripts [VISTO] `package.json:6-12`

| Script | Comando |
|---|---|
| `dev` | `vite` |
| `build` | `vite build` |
| `build:dev` | `vite build --mode development` |
| `lint` | `eslint .` |
| `preview` | `vite preview` |

**Não existe script de teste.** Não há `vitest`, `jest`, `playwright`, `cypress` nem `@testing-library/*` nas dependências. **Zero testes no projecto.** [VISTO]

### Configuração de build

- `vite.config.ts:7-10` — dev server em `host "::"`, `port 8080`. [VISTO]
- `vite.config.ts:12-15` — alias `@` → `./src`. [VISTO]
- `tsconfig.json:6-14` — **TypeScript em modo permissivo**: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`, `noUnusedParameters: false`, `skipLibCheck: true`, `allowJs: true`. [VISTO]
- Dois lockfiles coexistem: `bun.lockb` (9 Jan 2026) e `package-lock.json` (22 Jun 2026). Gestor de pacotes ambíguo. [VISTO]

---

## 3. Git

| Item | Valor |
|---|---|
| Branch actual | `main` [VISTO] `git branch --show-current` |
| Remoto | `origin` → `https://github.com/RafaelPilartes/grace-mind-connect` (fetch e push) [VISTO] |
| Sincronismo | `## main...origin/main` sem indicação de ahead/behind [VISTO] `git status -sb` |

### Há alterações por commitar? **Sim, mas são artefacto de fim de linha.**

- 182 ficheiros marcados como `M` (modificados), **0 ficheiros novos/untracked**. [VISTO] `git status --porcelain`
- `git diff --shortstat` → `182 files changed, 33645 insertions(+), 33645 deletions(-)` — inserções e remoções exactamente iguais. [VISTO]
- `git diff --ignore-all-space --shortstat` → **saída vazia**: nenhuma alteração substantiva. [VISTO]
- Causa confirmada: a árvore de trabalho tem CRLF, o HEAD tem LF. `file postcss.config.js src/App.tsx` → `ASCII text, with CRLF line terminators`; a versão em HEAD não contém `\r`. [VISTO]
- Não existe `.gitattributes` para normalizar fins de linha. [VISTO]

**Conclusão:** o working tree está funcionalmente limpo; os 182 "M" são conversão LF→CRLF em toda a árvore. [VISTO]

### Últimos 15 commits [VISTO] `git log -15`

| Hash | Data | Assunto |
|---|---|---|
| `ec51bf6` | 2026-03-27 | feat(admin): integrate user viewmodel and server-side roles in team dashboard |
| `f10247f` | 2026-03-27 | feat(core): complete domain normalization and decentralize profile activity tracking |
| `98b0bd1` | 2026-03-27 | feat: implement remaining domain DAOs, UseCases, and ViewModels (19 repositórios registados no ApiFactory) |
| `7026ebe` | 2026-03-26 | refactor: restructure entity layer & implement DAO relations |
| `fecc12c` | 2026-03-26 | refactor(core): migrate entities to domain-driven design |
| `c1d2d31` | 2026-03-25 | fixx: .env const name and RequesterRoutes |
| `ebbe2f5` | 2026-03-25 | `git commit -m "feat(db): normalize schema to profile-based keys and expand seed data"` (mensagem mal formada — contém o próprio comando) |
| `380c006` | 2026-03-25 | feat: setup Supabase integration and clean architecture layers |
| `2af554e` | 2026-03-25 | refactor: centralize mocks and align interfaces with entities |
| `0a51d1d` | 2026-03-25 | feat(ui): add dark mode support with next-themes and toggle component |
| `10bdf5b` | 2026-03-25 | ui: implement team management and advanced audit system |
| `86b4875` | 2026-03-25 | refactory: routes |
| `ef99df9` | 2026-03-25 | ui: fix layout |
| `2fbefc2` | 2026-03-24 | feat: rebrand platform to Portal dos Intérpretes |
| `58872a2` | 2026-03-24 | ui: update logo & colors |

Todos os commits são do mesmo autor (`Rafael Pilartes`). Intervalo dos 15: 2026-03-24 a 2026-03-27 — **quatro dias**. **O último commit é de 2026-03-27, ~6,5 meses antes desta data de inventário.** [VISTO]

**Leitura da trajectória:** o projecto foi construído primeiro como UI com mocks (até 2026-03-25) e só depois recebeu a camada Supabase e a arquitectura em camadas (2026-03-25 a 2026-03-27). A integração dos ecrãs com essa camada ficou quase toda por fazer (ver §6). [INFERIDO a partir das mensagens de commit + medição em §6]

---

## 4. Supabase

### Existe a pasta `supabase/`? Sim, mas **não é um projecto Supabase CLI.** [VISTO]

Conteúdo completo [VISTO] (`find supabase -type f`):

```
supabase/database_schema.sql   (25 268 bytes, 2026-03-26)
supabase/seed.sql              (41 029 bytes, 2026-03-26)
supabase/triggeers.sql         ( 4 931 bytes, 2026-03-25)   <- erro de ortografia no nome
```

| Item esperado | Estado |
|---|---|
| `supabase/config.toml` | **Não existe** [VISTO] |
| `supabase/migrations/` | **Não existe** — não há migrations versionadas [VISTO] |
| `supabase/functions/` (edge functions) | **Não existe** — zero edge functions [VISTO] |
| `supabase/.temp/` ou `.branches/` | **Não existe** [VISTO] |
| Seed | existe, mas como `supabase/seed.sql` solto (o CLI leria daí, mas sem `config.toml` não há CLI configurado) [VISTO] |

**O projecto está linked?** **Não.** Faltam `supabase/config.toml` e `supabase/.temp/project-ref`, que são os artefactos criados por `supabase link`. [VISTO quanto à ausência] / [INFERIDO quanto à conclusão]

**Número de migrations e intervalo de datas:** **zero migrations.** O schema vive em três ficheiros `.sql` soltos, aplicados manualmente. Não existe histórico incremental, nem ordenação garantida de aplicação, nem forma de saber o que já foi aplicado ao remoto. [VISTO]

### Projecto remoto usado pela app

| Item | Valor |
|---|---|
| Nome da variável de ambiente (URL) | `VITE_SUPABASE_URL` [VISTO] `.env`, `src/config/supabase.ts:3` |
| Nome da variável de ambiente (chave) | `VITE_SUPABASE_ANON_KEY` [VISTO] `.env`, `src/config/supabase.ts:4` |
| **Project ref** | **`mfobqukllkxuimcjiqvn`** (extraído do host da URL; a chave não foi lida nem é reproduzida aqui) [VISTO] |
| Cliente | `createClient(supabaseUrl, supabaseAnonKey)` sem opções, exportado como singleton `supabase` [VISTO] `src/config/supabase.ts:10` |
| Guarda de arranque | lança `Error('Missing Supabase environment variables')` se faltar uma das duas [VISTO] `src/config/supabase.ts:6-8` |

São as **únicas** duas variáveis de ambiente do projecto. [VISTO] (`.env` contém exactamente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)

### Conteúdo do schema local — contagens [VISTO]

| Objecto | Contagem | Ficheiro |
|---|---|---|
| `CREATE TABLE` | **37** | `supabase/database_schema.sql` |
| `CREATE INDEX` | 31 | `supabase/database_schema.sql` |
| `CREATE UNIQUE INDEX` | 0 | — |
| `CREATE TYPE` (enums Postgres) | **0** | — |
| `CREATE VIEW` / `CREATE OR REPLACE VIEW` | **0** | — |
| `CREATE FUNCTION` / `OR REPLACE FUNCTION` | 1 (`update_updated_at_column`) | `supabase/triggeers.sql:4` |
| `CREATE TRIGGER` | 1 em `database_schema.sql` + **33** em `triggeers.sql` | ambos |
| `ENABLE ROW LEVEL SECURITY` | **0** | — |
| `CREATE POLICY` | **0** | — |
| Referências a `storage.buckets` | **0** | — |
| `ALTER TABLE` | 0 | — |

As 37 tabelas [VISTO] `supabase/database_schema.sql`, por ordem de declaração (linha entre parênteses):

`users` (11), `admin_profiles` (45), `interpreter_profiles` (56), `requester_profiles` (73), `languages` (91), `specialties` (100), `interpreter_languages` (110), `interpreter_specialties` (116), `services` (125), `interpreter_services` (136), `interpreter_education` (150), `interpreter_experiences` (164), `interpreter_certifications` (175), `interpreter_portfolios` (188), `interpreter_availabilities` (201), `documents` (216), `verification_requests` (230), `bookings` (249), `booking_logs` (267), `chat_messages` (278), `reviews` (290), `favorites` (315), `payments` (326), `payouts` (340), `articles` (357), `forum_topics` (374), `forum_posts` (388), `legal_resources` (400), `success_cases` (413), `events` (431), `audit_logs` (453), `support_tickets` (478), `notifications` (493), `system_configs` (509), `opportunities` (575), `partnerships` (596), `testimonials` (614).

> **Sinal crítico para a Fase 1:** **zero RLS e zero policies no schema local.** A `anon key` é pública por desenho (vai no bundle do browser). Se o remoto também não tiver RLS, qualquer visitante pode ler e escrever nas 37 tabelas directamente via API REST do Supabase, sem passar pela aplicação. Só um dump do remoto confirma se o RLS foi activado pelo painel e nunca registado em ficheiro. [VISTO quanto à ausência local] / [DESCONHECIDO quanto ao estado remoto]

### Seed [VISTO] `supabase/seed.sql`

Contém `INSERT INTO` dirigidos a 34 tabelas distintas de `public` (algumas com 2 instruções). Inclui **um `INSERT INTO auth.users`** — escrita directa no schema `auth` gerido pelo Supabase, em vez de criar o utilizador pela API de auth. [VISTO]

Tabelas de `public` **sem `INSERT` no seed**: `booking_logs`, `forum_posts`, `system_configs`. [VISTO] (37 tabelas menos as 34 com seed)

### Edge functions

**Nenhuma.** Não existe `supabase/functions/`. A verificação exaustiva de `supabase.functions.invoke` e `.rpc()` no código fica para a Fase 2. [VISTO quanto à pasta]

---

## 5. Autenticação — métodos em uso

### O que existe na camada de dados [VISTO]

`src/modules/Api/supabase/SupabaseAuthDAO.ts` implementa 4 operações, todas contra `supabase.auth`:

| Método | Chamada Supabase | Linha |
|---|---|---|
| `signIn(email, password)` | `supabase.auth.signInWithPassword({ email, password })` | `SupabaseAuthDAO.ts:10` |
| `signUp(email, password, extraData)` | `supabase.auth.signUp({ email, password, options: { data: extraData } })` | `SupabaseAuthDAO.ts:27` |
| `signOut()` | `supabase.auth.signOut()` | `SupabaseAuthDAO.ts:43` |
| `getCurrentUser()` | `supabase.auth.getUser()` | `SupabaseAuthDAO.ts:53` |

**Método de login único: email + palavra-passe.** [VISTO]

**Ausentes** (busca em todo o `src/` por cada símbolo devolve zero ocorrências fora da cadeia auth): `signInWithOAuth` (nenhum provedor social), `signInWithOtp` (sem magic link), `resetPasswordForEmail` (sem reposição de palavra-passe real), `onAuthStateChange` (sem reacção a mudanças de sessão), `getSession`. [VISTO]

A cadeia de camadas está completa até ao viewmodel:
`src/core/interfaces/IAuthRepository.ts` → `src/modules/Api/supabase/SupabaseAuthDAO.ts` → `src/domain/usecases/AuthUseCase.ts` → `src/viewModels/auth.viewmodel.ts` (expõe `useCurrentUser`, `login`, `register`, `logout` com React Query + toasts). [VISTO]

### O que a UI realmente faz: **nada disto.** [VISTO]

- **`src/viewModels/auth.viewmodel.ts` não é importado por nenhum ficheiro.** Busca por `auth.viewmodel`, `useAuthViewModel`, `useSignIn`, `useSignUp`, `useSignOut`, `useCurrentUser` fora do próprio ficheiro devolve **zero resultados**. [VISTO]
- `src/pages/portal/auth/Login.tsx:14-23` — o `handleSubmit` faz `await new Promise(resolve => setTimeout(resolve, 1500))` e depois `toast.info('O sistema de autenticação será implementado em breve.')`. O comentário em `Login.tsx:18` di-lo explicitamente: `// Simulate login - will be replaced with actual auth`. [VISTO]
- O formulário **nem lê os valores dos campos**: os `<Input>` de email e password não têm `value`, `onChange` nem `name`. [VISTO] `Login.tsx:51-57, 73-79`
- `Login.tsx:115` — o link "Registe-se aqui" aponta para `/home/register`, **rota que não existe** (a rota registada é `/register`, em `src/routes/AppRoutes.tsx:27`). Cai no catch-all `/*` → `/home`. [VISTO]

**Conclusão: a aplicação não tem autenticação funcional.** Existe backend de auth implementado e por ligar; o ecrã de login é um stub. [VISTO]

### Autorização / guards de rota

**Não existe nenhum guard.** `src/routes/AppRoutes.tsx:19-42` monta todas as rotas em paralelo, sem wrapper de protecção. `RequesterRoutes.tsx:16`, `InterpreterRoutes.tsx:25` e `AdminRoutes.tsx:25` montam `/dashboard/requester`, `/dashboard/interpreter` e `/dashboard/admin` directamente nos respectivos `Layout`, sem verificação de sessão nem de papel. [VISTO]

→ **Qualquer visitante não autenticado pode navegar para `/dashboard/admin` e ver todo o dashboard de administração.** [VISTO]

---

## 6. Rotas e dados — leitura preliminar (detalhe na Fase 2)

### Contagem de rotas [VISTO]

| Grupo | Ficheiro | Rotas |
|---|---|---|
| Públicas | `src/routes/PublicRoutes.tsx:19-42` | 12 (incl. 4 dinâmicas por `:slug`) |
| Auth | `src/routes/AppRoutes.tsx:26-28` | 3 (`/login`, `/register`, `/recover-password`) |
| Solicitante | `src/routes/RequesterRoutes.tsx:16-27` | 10 |
| Intérprete | `src/routes/InterpreterRoutes.tsx:25-76` | 18 reais + 3 placeholders |
| Admin | `src/routes/AdminRoutes.tsx:25-145` | 18 reais + 10 placeholders |
| Redireccionamentos | `AppRoutes.tsx:20,40,41` | `/` → `/home`; `/*` → `/home`; `*` → `NotFound` |

**13 rotas são `ModulePlaceholder`** — ecrãs vazios com só título e descrição, sem conteúdo nem dados:
- intérprete: `opportunities`, `events`, `legal` [VISTO] `InterpreterRoutes.tsx:49-75`
- admin: `modules/opportunities`, `modules/library`, `modules/community`, `modules/events`, `modules/training`, `modules/mentorship`, `modules/forum`, `modules/legal`, `modules/benefits`, `modules/support` [VISTO] `AdminRoutes.tsx:55-144`

**`NotFound` é inalcançável:** a rota `/*` em `AppRoutes.tsx:40` redirecciona qualquer caminho desconhecido para `/home` **antes** de a rota `*` em `AppRoutes.tsx:41` poder corresponder. [VISTO quanto ao código] / [INFERIDO quanto ao efeito em runtime — a confirmar na Fase 2]

### Dados reais vs. mock — primeira medição [VISTO]

| Métrica | Valor |
|---|---|
| Ficheiros de página (`src/pages/**/*.tsx`) | **68** |
| Páginas que importam de `@/core/mocks` | **19** |
| Páginas que importam de `@/viewModels` | **1** — `src/pages/dashboard/admin/AdminTeam.tsx` |

As 19 com mocks [VISTO]: `admin/AdminAudit.tsx`, `admin/AdminInterpreterVerifications.tsx`, `admin/AdminVerificationHistory.tsx`, `admin/AdminVerificationRequests.tsx`, `interpreter/InterpreterVerification.tsx`, `interpreter/profile/InterpreterProfileContent.tsx`, `interpreter/profile/InterpreterProfileExperience.tsx`, `interpreter/profile/InterpreterProfileReviews.tsx`, `interpreter/profile/InterpreterProfileServices.tsx`, `requester/BrowseInterpreters.tsx`, `requester/FavoriteInterpreters.tsx`, `requester/NewRequest.tsx`, `portal/ArticlePage.tsx`, `portal/Home.tsx`, `portal/InterpreterArticles.tsx`, `portal/InterpreterProfile.tsx`, `portal/InterpreterVideos.tsx`, `portal/Interpreters.tsx`, `portal/Tutorials.tsx`.

As restantes ~48 páginas não importam nem mocks centralizados nem viewmodels — presumivelmente têm dados hardcoded inline. A verificar ficheiro a ficheiro na Fase 2. [VISTO quanto às contagens] / [INFERIDO quanto ao hardcode inline]

> **Sinal central do projecto:** foram construídos 38 DAOs Supabase, 38 interfaces, 37 usecases e 37 viewmodels — e **apenas 1 das 68 páginas os consome**. A camada de dados está essencialmente desligada da UI. [VISTO]

---

## 7. Deploy e configuração de ambiente

### Configuração de deploy: **nenhuma.** [VISTO]

Busca exaustiva até 3 níveis de profundidade, excluindo `node_modules/` e `.git/`, por `vercel.json`, `netlify.toml`, `now.json`, `Dockerfile*`, `docker-compose*`, `render.yaml`, `fly.toml`, `app.yaml`, `firebase.json`, `_redirects`, `.nvmrc`, `Procfile`, `amplify.yml`, `staticwebapp.config.json`, `CNAME` → **zero resultados**. [VISTO]

CI/CD: `.github/`, `.gitlab-ci.yml`, `.circleci/`, `.travis.yml`, `azure-pipelines.yml`, `bitbucket-pipelines.yml` → **todos ausentes**. Não há pipeline, nem workflow, nem Action. [VISTO]

### Há indício de a app estar publicada? **Nenhum indício local de publicação.** [VISTO quanto às buscas] / [INFERIDO quanto à conclusão]

| Fonte verificada | Resultado |
|---|---|
| Ficheiros de config de host | nenhum (acima) |
| Domínios em `src/`, `README.md`, `index.html`, `public/robots.txt` | **nenhum domínio próprio**. Os únicos domínios externos são `youtube.com`/`player.vimeo.com`/`img.youtube.com` (embeds de vídeo em `VideoSection.tsx:17,23`, `VideoModal.tsx:18,22`, `VideoTestimonials.tsx:34,38,48`, `ServiceDetailsModal.tsx:39-124`, e nos mocks `portalMocks.ts`, `interpretersMocks.ts`, `interpreterProfileMocks.ts`), `fonts.googleapis.com` (`src/index.css:6`) e `linkedin.com` (dado mock em `InterpreterProfileContact.tsx:23`) [VISTO] |
| `README.md` | não menciona deploy, Vercel, Netlify, Lovable, domínio nem URL de produção. Só instruções de execução local (`README.md:223-251`) [VISTO] |
| `index.html` meta tags | `og:image`/`twitter:image` apontam para `/og-image.png`, caminho relativo — não revelam domínio [VISTO] |
| `public/robots.txt` | permite tudo a todos os bots; **não tem directiva `Sitemap:`**, e não existe `sitemap.xml` em `public/` [VISTO] |
| `CNAME` | ausente → não há GitHub Pages com domínio próprio [VISTO] |

**Onde estaria publicada, se estivesse:** [DESCONHECIDO]. O repo não contém nenhuma pista. O projecto foi iniciado em Lovable (`lovable-tagger` em `vite.config.ts:4,10`), pelo que pode existir uma pré-visualização em `*.lovable.app` gerida fora do repo — mas **nada no código o confirma** e não foi feita nenhuma verificação de rede. [INFERIDO quanto à hipótese] / [DESCONHECIDO quanto ao facto]

**Consequência para uma SPA com React Router:** sem rewrite de SPA configurado no host, qualquer acesso directo a uma URL profunda (ex. `/dashboard/admin/requests/123`) devolve 404 do servidor estático. Nada no repo trata disso. [VISTO quanto à ausência] / [INFERIDO quanto à consequência]

### Divergência de nome do projecto [VISTO]

`README.md:234-235` instrui `git clone <URL_DO_REPOSITORIO>` seguido de `cd web-portal_do_interprete-ts`. O directório real do repo é `grace-mind-connect` e o `name` em `package.json:2` é `vite_react_shadcn_ts` (nome por omissão do template Lovable). Três nomes diferentes para o mesmo projecto; as instruções do README não funcionam como estão.

### `public/` [VISTO]

`favicon.ico`, `robots.txt`, `placeholder.svg`. **Não existe `og-image.png`**, apesar de `index.html:28` e `index.html:41` o referenciarem em `og:image` e `twitter:image`. Partilhas em redes sociais ficam sem imagem. [VISTO]

### `index.html` — problemas observados [VISTO]

- **Duas tags `<title>`**: `index.html:7` (`Portal interpretes` — sem acento, sem "dos") e `index.html:9` (`Portal dos Intérpretes | Academia Grace Mind`). O browser usa a primeira. [VISTO quanto às duas tags] / [INFERIDO quanto a qual vence]
- `index.html:6` — comentário TODO deixado do template Lovable: `<!-- TODO: Set the document title to the name of your application -->`. [VISTO]
- `index.html:2` — `<html lang="en">` enquanto todo o conteúdo e o `og:locale` são `pt_PT` (`index.html:29`). Problema de acessibilidade: leitores de ecrã escolhem a pronúncia errada. [VISTO]

### Segredos

| Item | Observação |
|---|---|
| `.env` | **está versionado no git** — `git ls-files --error-unmatch .env` confirma que é tracked [VISTO] |
| `.gitignore` | **não contém `.env`** nem `.env.local`; ignora apenas logs, `node_modules`, `dist`, `*.local`, ficheiros de editor e `.DS_Store` [VISTO] |
| Histórico | `.env` aparece em 2 commits: `c1d2d31` e `380c006` [VISTO] `git log --all -- .env` |
| Variáveis | apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. **Nenhum valor é reproduzido neste inventário.** [VISTO] |
| `.env.example` | não existe — ninguém sabe o que configurar num clone novo sem ler `src/config/supabase.ts` [VISTO] |

Nota de contexto: a `anon key` do Supabase é pública por desenho (vai no bundle). O risco real **não é** a chave estar no repo — é a chave pública estar combinada com **zero RLS** no schema local (§4). [VISTO] / [INFERIDO quanto ao risco combinado]

---

## 8. Resumo do estado, para a análise fora da sessão

| Dimensão | Estado observado |
|---|---|
| Repo | SPA única, Vite 5 + React 18 + TS 5 + shadcn/ui; sem monorepo; **sem testes**; sem CI; **sem config de deploy**; sem indício de publicação |
| Git | `main`, limpo na prática (182 "M" = LF→CRLF); último commit 2026-03-27 (~6,5 meses) |
| Supabase local | 3 `.sql` soltos; **0 migrations**, sem `config.toml`, **0 edge functions**, projecto **não linked** |
| Schema | 37 tabelas, 31 índices, 34 triggers `updated_at`, 1 função; **0 enums, 0 views, 0 RLS, 0 policies, 0 buckets** |
| Auth | backend Supabase (email+password) implementado e **100% desligado**; ecrã de login é stub (`setTimeout` + toast) |
| Autorização | **nenhum guard de rota**; `/dashboard/admin` acessível a qualquer visitante |
| UI vs. dados | 68 páginas: **1** usa viewmodels, 19 usam mocks, ~48 hardcoded; **13 rotas são placeholders vazios** |
| Project ref remoto | `mfobqukllkxuimcjiqvn` via `VITE_SUPABASE_URL` |

---

## 9. Acesso ao Supabase remoto — bloqueado

Foi autorizada a inspecção do remoto por MCP, estritamente de leitura. **O acesso falhou: o projecto do Portal não está acessível a este conector.** [VISTO]

### Estado do servidor MCP

| Item | Observação |
|---|---|
| Configuração local do servidor Supabase | **não existe**. Não há `.mcp.json`, `.claude/settings.json` nem `.claude/settings.local.json` no projecto; `.agent/mcp_config.json` declara apenas `context7` e `shadcn` (com `YOUR_API_KEY` por preencher), sem Supabase; `~/.claude.json` tem só `playwright`, no âmbito de outro projecto [VISTO] |
| Natureza do servidor | conector claude.ai (`mcp__claude_ai_Supabase__*`), configurado do lado do servidor na conta do utilizador. A flag de arranque não é legível localmente [VISTO] |
| **Modo read-only?** | **Não.** O servidor expõe ferramentas de escrita — `apply_migration`, `execute_sql`, `create_project`, `deploy_edge_function`, `create_branch`, `delete_branch`, `merge_branch`, `reset_branch`, `rebase_branch`, `pause_project`, `restore_project`. Em `--read-only` essas ferramentas não são expostas. [VISTO quanto às ferramentas expostas] / [INFERIDO quanto ao modo] |

### Projectos acessíveis [VISTO] `list_projects`

| ref | nome | região | estado | criado |
|---|---|---|---|---|
| `bjdiznuurkdjmxnmzufy` | NaLupa | eu-west-1 | ACTIVE_HEALTHY | 2026-04-14 |
| `vcmhadiotzswzkscfkqo` | dossierdecarreira | sa-east-1 | ACTIVE_HEALTHY | 2026-10-03 |
| `hicuwnzhfdjewjxjqxar` | dossierdecarreira_old | sa-east-1 | INACTIVE | 2026-09-16 |

Todos na organização `gcbcjsgzfvzcsuvqmtwc`. **Nenhum é o Portal dos Intérpretes.**

`get_project("mfobqukllkxuimcjiqvn")` → `MCP error -32600: You do not have permission to perform this action`. [VISTO]

**Causas possíveis, indistinguíveis com as ferramentas autorizadas:** o conector está autorizado noutra organização; o projecto pertence a outra conta; ou o projecto foi apagado/pausado. [INFERIDO]

**Nenhuma query foi executada contra nenhuma base de dados** — nem contra o alvo (inacessível), nem contra os três projectos listados (não são o alvo). [VISTO]

---

## 10. O que não foi verificado e porquê

- **Todo o estado real do schema remoto** — RLS e `relforcerowsecurity`, policies (`pg_policies`, incl. schema `storage`), grants de `anon`/`authenticated`, colunas, constraints, índices, enums, views, funções/RPC, triggers (incl. em `auth.users`), buckets de storage, edge functions, `get_advisors`, contagens de linhas. **Razão: o projecto `mfobqukllkxuimcjiqvn` não é acessível (§9).**
- **Divergências entre o snapshot local e o remoto** — mesma razão. Sem migrations e sem acesso ao remoto, não existe nenhuma fonte capaz de responder.
- **A secção "Exposição"** (o que `anon` e `authenticated` conseguem ler e escrever hoje) — mesma razão. É a pergunta mais importante do inventário e continua sem resposta.
- Conteúdo de cada ecrã, validações, estados vazio/erro/loading — Fase 2 (fonte local, não bloqueada).
- Máquinas de estado dos campos `status` — Fase 3 (fonte local, não bloqueada).

### Fontes usadas na Fase 0

Ficheiros locais, metadados git, e duas chamadas de leitura ao MCP do Supabase (`list_projects`, `get_project`) que estabeleceram a indisponibilidade do projecto. **Nenhuma query SQL foi executada contra nenhuma base de dados.** [VISTO]
