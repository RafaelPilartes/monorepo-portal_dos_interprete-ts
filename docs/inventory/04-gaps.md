# 04 — Lacunas (Fase 4)

Lista única e numerada dos problemas e dúvidas levantados nas Fases 1–3.

**Este documento não propõe correcções.** Registra o que existe, com evidência e gravidade.

| Gravidade | Significado |
|---|---|
| **bloqueia** | impede o produto de funcionar, ou impede saber se funciona em segurança |
| **risco** | pode causar perda de dados, exposição, ou falha em runtime |
| **qualidade** | inconsistência, código morto, dívida técnica sem consequência imediata |

Marca de origem: **[VISTO]** lido no código/ficheiro · **[INFERIDO]** deduzido · **[DESCONHECIDO]** não verificável.

---

## Bloqueantes

### 1. Sem acesso ao projecto Supabase do Portal

**Gravidade:** bloqueia · **[VISTO]**

O projecto que a aplicação usa, ref `mfobqukllkxuimcjiqvn`, não é acessível pelo conector MCP autorizado nesta sessão.

**Evidência:**
- `.env` → `VITE_SUPABASE_URL` aponta para o ref `mfobqukllkxuimcjiqvn`; lido também em `src/config/supabase.ts:3`
- `list_projects()` devolve três projectos (`bjdiznuurkdjmxnmzufy` NaLupa, `vcmhadiotzswzkscfkqo` dossierdecarreira, `hicuwnzhfdjewjxjqxar` dossierdecarreira_old), nenhum deles o Portal
- `get_project("mfobqukllkxuimcjiqvn")` → `MCP error -32600: You do not have permission to perform this action`
- Registo completo em `docs/inventory/00-overview.md` §9

**Consequência:** toda a Fase 1 sobre o estado real da base de dados ficou por fazer — RLS, policies, grants, enums, views, RPC, buckets, edge functions, triggers, contagens e divergências local↔remoto. É o bloqueio que torna os itens 2, 3 e 4 não resolúveis.

---

### 2. Estado do RLS desconhecido, com `anon key` no cliente

**Gravidade:** bloqueia · **[VISTO]** quanto ao local, **[DESCONHECIDO]** quanto ao remoto

**Evidência:**
- `supabase/database_schema.sql` — **0 ocorrências** de `ENABLE ROW LEVEL SECURITY` e **0** de `CREATE POLICY`, em 37 tabelas
- `supabase/database_schema.sql` — **0** `GRANT`/`REVOKE`
- `src/config/supabase.ts:4,10` — `VITE_SUPABASE_ANON_KEY` usada em `createClient`, entra no bundle do browser (modelo normal do Supabase)
- Estado no remoto: não verificável (item 1)

**Porque não é inferível:** o Supabase activa RLS por omissão nas tabelas criadas pelo *Table Editor*, mas **não** nas criadas por SQL em bruto, que é o caso aqui. Daí dois cenários indistinguíveis daqui: (A) 37 tabelas abertas a leitura e escrita por qualquer portador da chave pública; (B) RLS activado no painel e nunca versionado.

**O que estaria em causa no cenário A** (`01-database.md` §10): `payouts.iban`, `documents.file_url` (cartão de identidade, registo criminal), `users.email`/`phone`/`birth_date`, `payments.receipt_url`, `audit_logs.ip_address`/`session_id`/`previous_data`, `chat_messages`, `requester_profiles.nif`/`address`.

**Nota:** foi definida uma condição de paragem desta tarefa caso se verificasse escrita ou leitura anónima em tabelas com dados. **A condição não foi avaliável** — nem exposição nem contagens são conhecidas. A ausência de paragem não é prova de ausência de exposição.

---

### 3. Zero migrations

**Gravidade:** bloqueia · **[VISTO]**

**Evidência:**
- `supabase/` contém exactamente 3 ficheiros: `database_schema.sql`, `seed.sql`, `triggeers.sql` (`find supabase -type f`)
- **não existe** `supabase/migrations/`
- **não existe** `supabase/config.toml` → o projecto não está linked (`supabase link` cria-o)
- **não existem** tipos gerados (`src/integrations/supabase/types.ts` ausente; zero ocorrências de `public: {` em `src/**/*.ts`; `createClient` sem genérico em `src/config/supabase.ts:10`)

**Consequência:** não existe nenhuma fonte de verdade sobre o schema real, nem registo do que foi aplicado, quando ou por quem. O `.sql` é um snapshot manual sem data de aplicação conhecida. Sem migrations **e** sem tipos gerados, nem mesmo uma inspecção local permite inferir o estado do remoto.

---

### 4. O `database_schema.sql` não executa até ao fim

**Gravidade:** bloqueia · **[VISTO]** quanto ao erro, **[INFERIDO]** quanto ao efeito

**Evidência:**
- `supabase/database_schema.sql:549` — `CREATE INDEX IF NOT EXISTS idx_payouts_interpreter_profile_id ON payouts(interpreter_profile_id);`
- `supabase/database_schema.sql:342` — a coluna de `payouts` chama-se **`interpreter_id`**, não `interpreter_profile_id`
- `CREATE INDEX IF NOT EXISTS` é idempotente apenas quanto ao nome do índice; coluna inexistente → `ERROR: column … does not exist`, aborta
- As tabelas `opportunities` (`:575`), `partnerships` (`:596`) e `testimonials` (`:614`) são declaradas **depois** da secção de índices (`:523-572`)

**Consequência — a única conclusão segura:** o ficheiro, tal como está versionado, **nunca correu com sucesso de uma só vez**.

O estado resultante depende da via de execução, e não se sabe qual foi usada (não há migrations nem registo de aplicação — item 3):

| Via | Resultado ao chegar à linha 549 |
|---|---|
| SQL Editor do Supabase | o erro reverte o lote inteiro → **0 tabelas** |
| `psql` sem `ON_ERROR_STOP` | continua depois do erro → **37 tabelas**, sem esse índice |
| `psql` com `ON_ERROR_STOP=1` | pára na linha 549 → as 3 tabelas declaradas depois dos índices não chegam a ser criadas |

Logo, **não é possível afirmar quantas tabelas o remoto tem**. O que se conclui é que este ficheiro não pode ser tratado como descrição fiável da produção. Detalhe em `01-database.md` §6.

**Problema secundário relacionado:** `supabase/triggeers.sql` não tem `DROP TRIGGER IF EXISTS` antes dos 33 `CREATE TRIGGER` (`:13-77`), pelo que é executável uma única vez — contrasta com `handle_new_user`, que tem o `DROP` (`database_schema.sql:39`).

---

### 5. Autenticação não ligada

**Gravidade:** bloqueia · **[VISTO]**

A cadeia Supabase de auth está implementada e **nenhum ecrã a usa**.

**Evidência:**
- Cadeia completa: `src/core/interfaces/IAuthRepository.ts` → `src/modules/Api/supabase/SupabaseAuthDAO.ts:10,27,43,53` (`signInWithPassword`, `signUp`, `signOut`, `getUser`) → `src/domain/usecases/AuthUseCase.ts` → `src/viewModels/auth.viewmodel.ts`
- `src/viewModels/auth.viewmodel.ts` **não é importado por nenhum ficheiro** — busca por `auth.viewmodel`, `useAuthViewModel`, `useCurrentUser`, `useSignIn`, `useSignUp`, `useSignOut` fora do próprio ficheiro: **zero resultados**
- `src/pages/portal/auth/Login.tsx:18-21` — `// Simulate login - will be replaced with actual auth`, `setTimeout(1500)`, `toast.info('O sistema de autenticação será implementado em breve.')`
- `Login.tsx:51-57,73-79` — os `<Input>` de email e password **não têm `value`, `onChange` nem `name`**: o formulário nem lê o que o utilizador escreve
- `src/pages/portal/auth/Register.tsx:29-32` — idem
- `src/pages/portal/auth/RecoverPassword.tsx:17` — idem
- Ausentes em todo o `src/`: `onAuthStateChange`, `getSession`, `resetPasswordForEmail`, `signInWithOAuth`, `signInWithOtp`

**Consequência:** não há sessão em runtime. Todas as queries sairiam como `anon`. Combinado com o item 2 cenário B, qualquer policy baseada em `auth.uid()` devolveria zero linhas.

---

### 6. Zero guards de rota

**Gravidade:** bloqueia · **[VISTO]**

**Evidência:**
- `src/routes/AppRoutes.tsx:19-42` — todas as rotas montadas em paralelo, sem wrapper de protecção
- `src/routes/RequesterRoutes.tsx:16` — `<Route path="/dashboard/requester" element={<RequesterLayout />}>`
- `src/routes/InterpreterRoutes.tsx:25` — `<Route path="/dashboard/interpreter" element={<InterpreterLayout />}>`
- `src/routes/AdminRoutes.tsx:25` — `<Route path="/dashboard/admin" element={<AdminLayout />}>`
- Não existe componente `ProtectedRoute`/`RequireAuth`/`AuthGuard` em nenhum ficheiro
- `users.role` **nunca é lido**: `UserRole.*` aparece em 2 lugares em todo o `src/`, ambos de escrita (`AdminTeam.tsx:115`, `TeamMemberModal.tsx:77`)
- `admin_profiles.permission_level` é usado só para badge e filtro (`AdminTeam.tsx:28-33,143-159`), nunca para autorizar

**Consequência:** as 46 rotas de dashboard, incluindo as 28 de administração, abrem a qualquer visitante por URL directo. O papel do utilizador escolhe-se escrevendo o endereço. Não existe nenhuma camada de autorização no cliente — a totalidade do controlo de acesso depende de RLS cujo estado é desconhecido (item 2).

---

### 41. Perfis de intérprete públicos, quando o produto os quer só para quem tem conta

**Gravidade:** bloqueia · **[VISTO]**

> Numerado 41 e não 7 para não deslocar os itens 7–40, que são citados por número noutros documentos. Os números são identificadores, não ordem de prioridade. Está colocado entre os bloqueantes por gravidade.

Primeira divergência registada entre o produto e o código — e é o tipo de divergência que o `product-explainer.md` existe para apanhar.

**O que o produto define** [VISTO] `docs/_source/product-explainer.md`:
- §6: *"O directório mostra a lista, não os detalhes. O perfil de cada intérprete, com os seus vídeos e artigos, só abre depois de entrar com conta. Quem carrega num intérprete sem ter sessão vai para o login e, depois de entrar, volta ao perfil que queria ver."*
- §2: *"[o visitante] Não abre o perfil de nenhum intérprete: para ver os detalhes, tem de entrar com conta."*
- §4: *"[o perfil] Só quem tem conta o abre; o visitante vê o intérprete na lista, mas não entra no perfil."*

**O que o código faz** [VISTO] `src/routes/PublicRoutes.tsx` — quatro rotas de perfil montadas dentro de `<Route path="/" element={<PublicLayout />}>` (`:19`), sem qualquer guard:

| Rota | Linha | Componente |
|---|---|---|
| `/interpreters/:slug` | `:28` | `InterpreterProfile` (1147 linhas) |
| `/interpreters/:slug/videos` | `:30` | `InterpreterVideos` |
| `/interpreters/:slug/articles` | `:34` | `InterpreterArticles` |
| `/interpreters/:slug/articles/:articleSlug` | `:38` | `ArticlePage` |

**O que está em falta, além do guard:**
- não existe o redireccionamento para login nem o retorno ao perfil pretendido depois de entrar (o "volta ao perfil que queria ver" de §6) — não há nenhum `redirect`/`returnTo`/`from` em `src/routes/`
- `/interpreters` (`:27`), a lista, é correctamente pública — essa parte bate certo

**Porque bloqueia:** é a fronteira entre o que é aberto e o que é fechado no produto. Hoje os perfis mostram mocks, pelo que nada fica exposto; no momento em que mostrarem dados reais de intérpretes, o contrato do §6 está quebrado sem que nada o sinalize. E depende dos itens 5 (sem autenticação) e 6 (sem guards): não é corrigível isoladamente.

**Observação de desenho, não defeito:** a regra do §6 interage com P14 (contactos no perfil) — se o perfil abre a qualquer pessoa com conta e mostra telefone e redes sociais, o serviço pode ser combinado fora da plataforma, o que pesa em P4 (dinheiro). Ambas em aberto no `product-explainer.md` §8.

---

## Risco

### 7. `StatusBadge` lança excepção com os valores reais do schema

**Gravidade:** risco · **[VISTO]** quanto ao código, **[INFERIDO]** quanto ao erro em runtime

**Evidência:**
- `src/components/dashboard/StatusBadge.tsx:3-14` — `StatusType` aceita `pending`, `approved`, `rejected`, `completed`, `canceled`, `in_progress`, `confirmed`, `active`, `inactive`, `verified`, `unverified`
- `supabase/database_schema.sql:253` — `bookings.status` usa `pending`, **`accepted`**, `rejected`, `completed`, **`cancelled`**, `in_progress`
- `accepted` e `cancelled` **não existem** no `statusConfig`; `cancelled` difere de `canceled` numa letra
- `StatusBadge.tsx:68-80` — `const config = statusConfig[status]` e logo `config.className` (`:75`) e `config.label` (`:79`), **sem fallback**

**Consequência:** com `status = 'accepted'` ou `'cancelled'`, `config` é `undefined` e `:75` lança `TypeError: Cannot read properties of undefined (reading 'className')`. O componente é usado em quase todas as listas de pedidos. Hoje não falha porque os mocks usam o vocabulário do componente.

---

### 8. Cinco vocabulários incompatíveis para o estado de um pedido

**Gravidade:** risco · **[VISTO]**

**Evidência:**
| Fonte | `ficheiro:linha` | Valores |
|---|---|---|
| schema | `database_schema.sql:253` | `pending`, `accepted`, `rejected`, `completed`, `cancelled`, `in_progress` |
| `BookingStatus` (oficial) | `src/type/enum/booking.ts` | idem — **nunca importado por nenhuma página** |
| `RequestDetails.tsx:25` | | `pending`, `approved`, `rejected`, `completed`, `canceled`, `in_progress`, `confirmed` |
| `AdminRequests.tsx:11` | | `pendente`, `confirmado`, `concluido`, `cancelado` (português) |
| `InterpreterRequestDetails.tsx:14` | | `pending`, `confirmed`, `in_progress`, `completed`, `canceled` |
| `verificationMocks.ts:1` | | `pending`, `approved`, `rejected`, `expired` |

Cada ecrã redefine `type RequestStatus` localmente. Contagem de literais em `src/pages`, `src/components` e `src/core/mocks`: `pending` 50, `concluido` 25, `rejected` 23, `pendente` 21, `approved` 21, `completed` 19, `active` 16, `confirmado` 15, `expired` 11, `cancelado` 11, `accepted` 11, `confirmed` 9, `canceled` 6, `cancelled` 2, `in_progress` 1.

---

### 9. Dezoito divergências entre o schema esperado pelo código e o snapshot

**Gravidade:** risco · **[VISTO]** quanto à divergência, **[DESCONHECIDO]** quanto a qual lado está certo

Lista completa em `01-database.md` §5.2 B. As de maior impacto:

| Ref | Divergência | `ficheiro:linha` |
|---|---|---|
| B1 | DAO usa tabela **`interpreter_educations`** (plural); schema tem `interpreter_education` (singular, `:150`) | `SupabaseInterpreterEducationDAO.ts:10` |
| B5 | tipo declara **`accept_open_requests`**, coluna inexistente — e há um ecrã inteiro para a funcionalidade (`InterpreterOpenRequests.tsx`, 360 linhas) | `src/type/database/identity.ts:55` |
| B6 | tipo declara `languages: string[]` e `specialty: string[]` em `InterpreterProfileProps`; as relações são M:N em tabelas **sem DAO** | `identity.ts:57-58` |
| B8 | `InterpreterExperienceProps` **não tem** `interpreter_profile_id`, que é `NOT NULL` no schema (`:166`) → `create()` violaria NOT NULL | `src/type/database/interpreter.ts:44-52` |
| B12 | embed `posted_by_partner:partnerships(*)`, mas `opportunities.posted_by_partner_id` → `users(id)` (`:591`) | `SupabaseOpportunityDAO.ts:10` |
| B13 | embeds para `interpreter_profiles`/`requester_profiles`, mas `success_cases.interpreter_id`/`requester_id` → `users(id)` (`:421-422`) | `SupabaseSuccessCaseDAO.ts:10` |
| B15 | embed `payment:payments(*)`, mas `verification_requests.payment_id` **não tem FK** (`:241`) | `SupabaseVerificationRequestDAO.ts:10` |
| B16 | embeds duplicados para a mesma tabela sem hint de FK (PostgREST não desambigua) | `SupabaseDocumentDAO.ts:10`, `SupabaseSupportTicketDAO.ts:10`, `SupabaseTestimonialDAO.ts:10`, `SupabaseReviewDAO.ts:10`, `SupabaseForumPostDAO.ts:10` |
| B17 | embed `user:users(*)` em `audit_logs`, cujo `user_id` **não tem FK** (`:455`) | `SupabaseAuditLogDAO.ts:10` |

**Nenhuma é detectável em build:** `tsconfig.json:6-14` tem `strictNullChecks: false` e `noImplicitAny: false`; `BaseSupabaseDAO.ts:118,129` faz `data as any`. Só apareceriam em runtime — e não aparecem hoje porque 1 das 68 páginas usa esta camada.

**O que estas divergências não provam:** nada sobre o remoto. Como não existem tipos gerados a partir da base (`01-database.md` §5.3), e os 8 ficheiros de `src/type/database/` foram escritos à mão nos mesmos dias que o `.sql`, nomes como `interpreter_educations` ou `accept_open_requests` podem ter vindo de um modelo que existiu no remoto **ou** ser erros e intenções de quem escreveu os tipos sem os confrontar com o SQL. As duas explicações são igualmente compatíveis com a evidência local. Qual é a real: **[DESCONHECIDO]** — é a dúvida D5.

---

### 10. Cascata destrutiva em `bookings.service_id`

**Gravidade:** risco · **[VISTO]** quanto ao SQL, **[INFERIDO]** quanto ao efeito em cascata

**Evidência:** `supabase/database_schema.sql:252` — `service_id UUID REFERENCES services(id) ON DELETE CASCADE`

**Consequência:** apagar um serviço do catálogo apaga todas as reservas históricas que o usaram, incluindo `completed` — e, em cascata, os respectivos `payments` (`:327`), `reviews` (`:292`), `chat_messages` (`:279`), `booking_logs` (`:268`) e `success_cases` (`:423`). Destrói o histórico financeiro. O ecrã `AdminServices.tsx` tem acção de desactivar com toast (hoje não escreve).

---

### 11. `.env` versionado no git e sem `.env.example`

**Gravidade:** risco · **[VISTO]**

**Evidência:**
- `git ls-files --error-unmatch .env` → o ficheiro **é tracked**
- `.gitignore` **não contém** `.env` nem `.env.local` (ignora logs, `node_modules`, `dist`, `*.local`, editores, `.DS_Store`)
- `git log --all -- .env` → presente em 2 commits: `c1d2d31`, `380c006`
- não existe `.env.example`

**Nota de contexto:** a `anon key` é pública por desenho, pelo que o risco real não é a chave estar no repo — é a combinação com o item 2. Mas o padrão (`.env` tracked, sem `.gitignore`, sem `.env.example`) significa que qualquer segredo futuro ali colocado será commitado por omissão.

---

### 12. Nenhuma validação de formulários em toda a aplicação

**Gravidade:** risco · **[VISTO]**

**Evidência:**
- `zod ^3.25.76`, `react-hook-form ^7.61.1` e `@hookform/resolvers ^3.10.0` estão em `package.json`
- Busca por `from 'zod'`, `zodResolver`, `useForm` em todo o `src/`: **a única ocorrência é `src/components/ui/form.tsx`**
- `src/components/ui/form.tsx` **não é importado por nenhuma página**
- Apenas 5 ecrãs têm `<form onSubmit>`: `Login.tsx:46`, `Register.tsx`, `RecoverPassword.tsx`, `Contact.tsx:52`, `RequesterProfile.tsx:29` — todos com validação só por `required` do HTML
- `NewRequest.tsx:83-95` — `canProceed()` é a única validação com lógica, e é só presença (`!!`): não valida que a data seja futura, que o link seja um URL, nem que a duração seja um número positivo; o passo 7 devolve sempre `true`

---

### 13. Falha silenciosa na única escrita real da aplicação

**Gravidade:** risco · **[VISTO]**

**Evidência:** `src/pages/dashboard/admin/AdminTeam.tsx:89-122`

- `:119-121` — `catch (error) { console.error(error) }`, **sem toast**
- `:118` — `setIsModalOpen(false)` executa **antes** do catch: num erro, o modal fecha e nada é dito ao utilizador
- `:65` — `const { data: adminsResponse, isLoading } = getAllAdminProfiles(...)`: **`isError` não é desestruturado nem usado**. Um erro de leitura mostra lista vazia como se não houvesse administradores
- `:105-116` — duas escritas sequenciais sem transacção: `INSERT admin_profiles` e depois `UPDATE users SET role='admin'`. Se a segunda falhar, fica perfil criado com `role` não actualizado — e o utilizador não é informado, pelo motivo acima
- Não há `.rpc()` nem edge function que faça as duas atomicamente (zero ocorrências de `.rpc(` e `functions.invoke` em todo o `src/`)

---

### 14. `audit_logs` não é escrita por nada, e o seu desenho impede escrita do cliente

**Gravidade:** risco · **[VISTO]** quanto às colunas, **[INFERIDO]** quanto à impossibilidade

**Evidência:**
- `database_schema.sql:468-471` — `ip_address TEXT NOT NULL`, `user_agent TEXT NOT NULL`, `session_id TEXT NOT NULL`
- Um cliente de browser não tem acesso fiável ao seu próprio IP
- Não há edge functions (`supabase/functions/` ausente) nem RPC (zero `.rpc(` em `src/`) que escrevessem do lado do servidor
- `AdminAudit.tsx:26,46` lê `mockLogs` de `@/core/mocks/auditMocks`
- As escritas reais de `AdminTeam.tsx` (criar/alterar administradores) **não deixam registo de auditoria**

---

### 15. `interpreter_profiles.verified` nunca é escrito

**Gravidade:** risco · **[VISTO]**

**Evidência:**
- `database_schema.sql:66` — `verified BOOLEAN DEFAULT false`
- Nenhum código o escreve; não há trigger que o derive de `verification_requests.status = 'approved'` (`triggeers.sql` só tem `updated_at`)
- O fluxo de verificação tem 2011 linhas de UI em 4 ecrãs: `InterpreterVerification.tsx` (421), `AdminVerificationRequests.tsx` (852), `AdminInterpreterVerifications.tsx` (402), `AdminVerificationHistory.tsx` (336) — e nenhum escreve

**Consequência:** o selo "Verificado" nos perfis públicos (`portal/InterpreterProfile.tsx`) viria sempre a `false` com dados reais, independentemente de quantas aprovações o admin registasse.

---

### 16. Onze denormalizações sem nada que as mantenha

**Gravidade:** risco · **[VISTO]**

Verificado por busca em todo o `src/` e nos três `.sql` (`01-database.md` §7):

| Coluna | Deveria derivar de | Quem actualiza |
|---|---|---|
| `interpreter_profiles.rating` | média de `reviews.rating` | ninguém |
| `interpreter_profiles.review_count` | contagem de `reviews` | ninguém |
| `forum_topics.post_count` | contagem de `forum_posts` | ninguém |
| `forum_topics.last_post_at` | máx. de `forum_posts.created_at` | ninguém |
| `forum_posts.like_count` | — | ninguém; **não existe tabela de likes** |
| `articles.view_count` | visitas | ninguém |
| `events.registered_count` | — | ninguém; **não existe tabela de inscrições** |
| `articles.author_name` | `users.name` | ninguém (dessincroniza) |
| `booking_logs` (tabela inteira) | transições de `bookings.status` | **ninguém** |
| `documents.reviewed_at`/`reviewed_by_user_id` | acto de revisão | ninguém |
| `verification_requests.reviewed_at`/`admin_reviewer_id` | idem | ninguém |
| `testimonials.approved_at`/`approved_by_user_id` | acto de aprovação | ninguém |

Os primeiros oito são valores que a UI mostra. Com dados reais ficariam permanentemente a zero.

---

### 17. Função `handle_new_user` não define `role` nem cria perfil

**Gravidade:** risco · **[VISTO]**

**Evidência:** `database_schema.sql:25-41`

- O `INSERT` cobre apenas `id, email, name, avatar_url` → **`users.role` fica NULL**
- `SupabaseAuthDAO.ts:27-33` passa `extraData` para `raw_user_meta_data`, mas a função só lê `full_name`, `name` e `avatar_url` — qualquer `role` enviado no registo é **silenciosamente ignorado**
- Não insere em `interpreter_profiles`, `requester_profiles` nem `admin_profiles`: um utilizador recém-registado **não tem perfil**
- `interpreter_profiles.bio` é `NOT NULL` (`:58`), pelo que criar o perfil depois exige sempre uma bio
- `SECURITY DEFINER` **sem `SET search_path`** — o padrão que o linter do Supabase sinaliza como `function_search_path_mutable` [INFERIDO quanto ao aviso]
- Sem bloco `EXCEPTION`: se o `INSERT` falhar (ex. colisão em `users.email UNIQUE`), a transacção de registo em `auth.users` falha inteira [INFERIDO]

---

### 18. O único fluxo funcional da aplicação não é inicializável

**Gravidade:** risco · **[VISTO]** quanto ao código, **[INFERIDO]** quanto à consequência

**Evidência:**
- `src/components/dashboard/modals/TeamMemberModal.tsx:73-78` — o combobox de selecção de utilizador chama `getAllUsers(undefined, 0, searchUser, { role: UserRole.ADMIN })`: **só mostra utilizadores que já têm `role = 'admin'`**
- `src/pages/dashboard/admin/AdminTeam.tsx:113-116` — o objectivo do fluxo é precisamente atribuir `role = 'admin'`
- `database_schema.sql:25-41` — `handle_new_user` cria utilizadores com `role = NULL` (item 17)

**Consequência:** um utilizador com `role = NULL` nunca aparece no combobox, logo nunca pode ser promovido pela UI. O primeiro administrador da plataforma só existe por `INSERT`/`UPDATE` manual na base de dados. O único fluxo que escreve é circular e sem ponto de entrada.

---

### 19. Nove entidades de negócio com interface e sem tabela

**Gravidade:** risco · **[VISTO]**

| Entidade | Onde está na UI | Tabela |
|---|---|---|
| **Proposta de preço / negociação** | `RequestNegotiationChat.tsx:154-215` (enviar/aceitar/recusar proposta); histórico em `AdminRequestDetails.tsx:64-66` (`{ by, amount, status }`) | **não existe.** `chat_messages` tem `content`, `attachment_url`, `attachment_type` — nenhuma coluna de valor nem de estado de proposta |
| **Candidatura a pedido aberto** | `InterpreterOpenRequests.tsx` (360 linhas) | **não existe** |
| **Mensagem de contacto** | `Contact.tsx:52` | **não existe** |
| **Preferências de notificação** | `RequesterSettings.tsx`, `InterpreterSettings.tsx` | **não existe** |
| **Inscrição em evento** | pressuposta por `events.registered_count` (`:443`) | **não existe** |
| **Like em post de fórum** | pressuposto por `forum_posts.like_count` (`:395`) | **não existe** |
| **Validade de verificação** (`expired`) | `verificationMocks.ts:1-3`; estatísticas em `AdminVerificationRequests.tsx:204-207` e `AdminVerificationHistory.tsx:113-115` | **não existe coluna de validade** em `documents` nem `verification_requests` |
| **Suspensão** (`suspended`) | `verificationMocks.ts:2`, `UserSuspensionModal.tsx` | **não existe valor nem coluna** |
| **Tutoriais** | `/tutorials` (`portalMocks.ts`) | **não existe** |

---

### 20. Línguas e especialidades do intérprete: sem via de acesso

**Gravidade:** risco · **[VISTO]**

**Evidência:**
- `database_schema.sql:110-120` — `interpreter_languages` e `interpreter_specialties` existem, com PK composta e FKs
- **Nenhuma das duas tem DAO**: não existe `SupabaseInterpreterLanguageDAO` nem `SupabaseInterpreterSpecialtyDAO` em `src/modules/Api/supabase/` (38 DAOs, nenhum para estas)
- Nenhum ecrã as gere
- Tentativa de contorno nos tipos: `languages: string[]` e `specialty: string[]` em `InterpreterProfileProps` (`src/type/database/identity.ts:57-58`) — campos que não existem na tabela `interpreter_profiles` (item 9, B6)
- O `selectQuery` do DAO de perfil é `'*, user:users(*)'` (`SupabaseInterpreterProfileDAO.ts:11`) — **não carrega as junções**

**Consequência:** um intérprete não tem como declarar que línguas interpreta, num directório de intérpretes de Língua Gestual Angolana. E o directório público não tem como filtrar por língua com dados reais.

---

### 21. Sem configuração de deploy e sem rewrite de SPA

**Gravidade:** risco · **[VISTO]** quanto à ausência, **[INFERIDO]** quanto à consequência

**Evidência:**
- Busca exaustiva até 3 níveis (excluindo `node_modules/`, `.git/`) por `vercel.json`, `netlify.toml`, `now.json`, `Dockerfile*`, `docker-compose*`, `render.yaml`, `fly.toml`, `app.yaml`, `firebase.json`, `_redirects`, `.nvmrc`, `Procfile`, `amplify.yml`, `staticwebapp.config.json`, `CNAME` → **zero resultados**
- CI/CD: `.github/`, `.gitlab-ci.yml`, `.circleci/`, `.travis.yml`, `azure-pipelines.yml`, `bitbucket-pipelines.yml` → **todos ausentes**

**Consequência:** numa SPA com React Router, sem rewrite configurado no host, qualquer acesso directo a URL profundo (ex. `/dashboard/admin/requests/123`) devolve 404 do servidor estático. Nada no repositório trata disso. Se a app está publicada: **[DESCONHECIDO]** — nenhum domínio próprio aparece em `src/`, `README.md`, `index.html` ou `public/robots.txt`.

---

### 22. Zero testes

**Gravidade:** risco · **[VISTO]**

**Evidência:** `package.json` não tem script de teste; não há `vitest`, `jest`, `playwright`, `cypress` nem `@testing-library/*` nas dependências; nenhum ficheiro `*.test.*` ou `*.spec.*` no projecto.

Combinado com `tsconfig.json:6-14` (`strictNullChecks: false`, `noImplicitAny: false`, `noUnusedLocals: false`, `noUnusedParameters: false`, `skipLibCheck: true`, `allowJs: true`), não existe nenhuma rede de segurança: nem tipos estritos nem testes. As 18 divergências do item 9 passariam todas em build.

---

### 23. Realtime subscrito sem publicação configurada

**Gravidade:** risco · **[VISTO]** quanto ao código, **[DESCONHECIDO]** quanto ao remoto

**Evidência:**
- `src/modules/Api/supabase/BaseSupabaseDAO.ts:143-285` — quatro métodos (`listenById`, `listenByField`, `listenAllByField`, `listenAll`) subscrevem `postgres_changes` com `schema: 'public'`, `table: this.tableName`
- Não existe nenhum `ALTER PUBLICATION supabase_realtime` nos três `.sql`
- Estado da publicação no remoto: não verificável (item 1)

**Consequência:** se a publicação não incluir as tabelas, as subscrições ligam-se e **nunca recebem eventos, sem erro visível**. Nenhum ecrã usa estes métodos hoje.

---

### 24. Sete colunas `status` `NOT NULL` sem default

**Gravidade:** risco · **[VISTO]** quanto ao SQL, **[INFERIDO]** quanto ao efeito

**Evidência:** `payments.status` (`:331`), `payouts.status` (`:345`), `articles.status` (`:364`), `events.status` (`:435`), `opportunities.status` (`:581`), `support_tickets.status` (`:486`), `testimonials.status` (`:621`) — todas `TEXT NOT NULL` sem `DEFAULT`.

`BaseSupabaseDAO.create()` (`:115-124`) envia apenas as colunas presentes no objecto recebido. Um `create()` nestas tabelas sem `status` explícito falha com violação de NOT NULL. Contrasta com `bookings.status` e `documents.status`/`verification_requests.status`, que têm `DEFAULT 'pending'`.

---

## Qualidade

### 25. Sessenta e uma de sessenta e duas transições de estado não são executadas por código

**Gravidade:** qualidade (sintoma de 5 e 6; consequência prática) · **[VISTO]**

Levantamento completo em `03-flows.md` §6. A única transição executada é `admin_profiles.is_active` (`AdminTeam.tsx:126-131`).

Nenhum código faz: criar `bookings`, `pending→accepted`, `pending→rejected`, `→cancelled`, aprovar/rejeitar verificações ou documentos, aprovar testemunhos, publicar casos de sucesso ou recursos legais, transitar pagamentos ou payouts.

**Dois estados não têm sequer ecrã que os pretenda produzir:** `bookings.status = 'in_progress'` e `'completed'` — não existe acção "iniciar serviço" nem "concluir serviço" em nenhum dos 68 ecrãs. Consequência em cadeia: nunca se cria uma `review` legítima, nunca se gera `payment` nem `payout`, e `rating`/`review_count` ficam a zero (item 16).

---

### 26. Quarenta e nove confirmações falsas ao utilizador

**Gravidade:** qualidade · **[VISTO]**

49 chamadas a `toast.success`/`error`/`info` em `src/pages`. Com a excepção das 2 de `AdminTeam.tsx`, **todas confirmam acções que não escrevem nada**.

Exemplos: `NewRequest.tsx:108` "Solicitação criada com sucesso!"; `AdminRequestDetails.tsx:100` "Status alterado para: X"; `InterpreterRequestDetails.tsx:44` "Solicitação aceite com sucesso!"; `AdminVerificationHistory.tsx:107` "O ficheiro será descarregado em breve." (exportação não implementada).

---

### 27. Camada de dados quase inteiramente sem consumidor

**Gravidade:** qualidade · **[VISTO]**

| Camada | Ficheiros | Consumidos por ecrãs |
|---|---|---|
| DAOs Supabase | 38 | **2** (`SupabaseAdminProfileDAO`, `SupabaseUserDAO`) |
| Interfaces `I*Repository` | 38 | 2 |
| UseCases | 37 | 2 |
| ViewModels | 37 | **2** (`admin-profile.viewmodel`, `user.viewmodel`) |
| `SupabaseStorageDAO` | 1 | **0** — nenhum ecrã carrega ficheiros, incluindo `InterpreterDocuments.tsx` e `MediaUploader.tsx` |
| `SupabaseAuthDAO` + `auth.viewmodel` | 2 | **0** |

Páginas: 68 no total — **1** com dados reais, 19 com mocks de `@/core/mocks`, ~43 com dados hardcoded inline.

---

### 28. Doze tabelas sem ecrã, treze rotas que são ecrãs vazios

**Gravidade:** qualidade · **[VISTO]**

**Tabelas com DAO e sem ecrã:** `booking_logs`, `forum_topics`, `forum_posts`, `legal_resources`, `opportunities`, `partnerships`, `events`, `support_tickets`, `notifications`, `system_configs`, `payments`, `payouts`.

**Treze rotas são `ModulePlaceholder`** (`src/pages/dashboard/modules/ModulePlaceholder.tsx`, 21 linhas, ecrã vazio com 🚧):
- intérprete (`InterpreterRoutes.tsx:49-75`): `opportunities`, `events`, `legal`
- admin (`AdminRoutes.tsx:55-144`): `modules/opportunities`, `modules/library`, `modules/community`, `modules/events`, `modules/training`, `modules/mentorship`, `modules/forum`, `modules/legal`, `modules/benefits`, `modules/support`

`partnerships` é além disso uma **ilha**: não tem FK para fora e nenhuma tabela tem FK para ela (`database_schema.sql:596-612`).

---

### 29. Oito rotas e ligações quebradas

**Gravidade:** qualidade · **[VISTO]**

| # | Problema | `ficheiro:linha` |
|---|---|---|
| a | `NotFound` **inalcançável**: `/*` → `Navigate to="/home"` precede `*` → `<NotFound />` | `AppRoutes.tsx:40-41` |
| b | `src/pages/Index.tsx` é código morto que redirecciona para `/portal-interpretes`, **rota inexistente**; e o ficheiro não é importado por nenhum ficheiro de rotas | `Index.tsx:4` |
| c | "Registe-se aqui" → `/home/register`, inexistente (a rota é `/register`) | `Login.tsx:115` |
| d | "Meu Perfil" → `` `/dashboard/${userRole}/perfil` ``: `userRole` é `solicitante`/`interprete`/`admin` (português) mas as rotas são `requester`/`interpreter`/`admin`; e o segmento é `perfil` mas a rota é `profile` | `DashboardLayout.tsx:189` |
| e | "Configurações" → `/home` em vez de `/dashboard/<role>/settings` | `DashboardLayout.tsx:190` |
| f | "Sair" é um `<Link to="/home">` **sem `signOut()`** | `DashboardLayout.tsx:192` |
| g | `NotFound` em inglês ("Oops! Page not found", "Return to Home") numa aplicação pt-PT | `NotFound.tsx:15-18` |
| h | identidade hardcoded nos três layouts | `AdminLayout.tsx:125-127`, `RequesterLayout.tsx:41-43`, `InterpreterLayout.tsx:81-83` |

---

### 30. Cinco componentes órfãos

**Gravidade:** qualidade · **[VISTO]**

Verificado por busca do nome de cada componente em todo o `src/`, excluindo a própria declaração:

`src/components/NavLink.tsx` · `src/components/dashboard/DataTable.tsx` · `src/components/dashboard/modals/ReviewInterpreterModal.tsx` · `src/components/dashboard/modals/CancelRequestModal.tsx` · `src/components/dashboard/modals/InterpreterPreviewModal.tsx`

Nota: `CancelRequestModal` é órfão apesar de existir um `handleCancel` em `RequestDetails.tsx:102` que não o usa; `ReviewInterpreterModal` é órfão apesar de existir a rota `requester/reviews`.

Acresce `src/components/ui/form.tsx`, único ficheiro a importar `zod` e `react-hook-form`, não importado por nenhuma página (item 12).

**Pastas vazias ou mortas:** `src/modules/Api/firebase/` (vazia); `src/modules/Api/rest/` com `api.server.ts` e `users.dao.ts` de **0 bytes**.

---

### 31. Zero enums Postgres: nenhum domínio de valores é imposto pela base de dados

**Gravidade:** qualidade · **[VISTO]**

**Evidência:** `grep -ci "CREATE TYPE" supabase/database_schema.sql` → **0**. Todas as colunas de domínio restrito (`status`, `type`, `role`, `severity`, `priority`, `category`, `modality`, `location_type`, `target_scope`, `permission_level`, `value_type`) são `TEXT` livre, com os valores válidos apenas em comentário `--`.

**Única excepção em todo o schema:** `reviews.rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)` (`:296`). Note-se que `testimonials.rating` (`:620`) é `INTEGER` **sem CHECK**.

Consequência: `UPDATE bookings SET status = 'banana'` é aceite. Os 23 enums TypeScript em `src/type/enum/` reproduzem os comentários à mão e não têm correspondência imposta na base de dados.

---

### 32. Constraints de integridade em falta

**Gravidade:** qualidade · **[VISTO]** quanto às ausências, **[INFERIDO]** quanto aos efeitos

| Tabela | Ausência | `ficheiro:linha` |
|---|---|---|
| `reviews` | nada impede **auto-avaliação**: `author_interpreter_id = target_interpreter_id` passa os dois CHECKs | `:303-311` |
| `reviews` | nada liga autor nem alvo à `booking`: pode avaliar-se uma reserva em que nenhum participou | `:290-313` |
| `reviews` | `UNIQUE(booking_id, author_interpreter_id, author_requester_id)` tem sempre uma coluna NULL (por força do `reviews_author_check`); em Postgres dois NULL não colidem, pelo que **não impede duplicados** | `:312` |
| `bookings` | nenhum CHECK liga `location_type` a `meeting_link`/`address`: `online` sem link, ou `presencial` sem endereço, é válido | `:258-261` |
| `events` | sem CHECK `end_date > start_date` | `:437-438` |
| `interpreter_availabilities` | mistura recorrência semanal e excepção pontual no mesmo registo, sem CHECK que force um dos dois: linha com tudo NULL é válida | `:201-214` |
| `notifications` | `target_scope` + `is_specific` + três FKs opcionais, sem CHECK de coerência entre eles | `:493-508` |
| `notifications` | **não existe `read_at` nem `is_read`**: não há forma de marcar uma notificação como lida | `:493-508` |
| `verification_requests` | `document_ids TEXT[]` em vez de FK: sem integridade referencial com `documents` | `:235` |
| `verification_requests` | `payment_id UUID` **sem FK nenhuma** | `:241` |
| `audit_logs` | `user_id UUID NOT NULL` **sem FK** (defensável numa tabela de auditoria) | `:455` |
| `opportunities` | `languages_required TEXT[]`, `specialties_required TEXT[]` em vez de FKs para `languages`/`specialties` | `:584-585` |
| `chat_messages` | `read_at` existe mas nenhum ecrã o escreve | `:283` |

---

### 33. Convenções de nomes inconsistentes no schema

**Gravidade:** qualidade · **[VISTO]**

| Irregularidade | Onde | Convenção dominante |
|---|---|---|
| `payouts.interpreter_id` | `:342` | `interpreter_profile_id` (usado em 9 tabelas) |
| `success_cases.interpreter_id` → `users(id)` | `:421` | as outras tabelas apontam para os **perfis** |
| `success_cases.requester_id` → `users(id)` | `:422` | idem |
| `opportunities.posted_by_partner_id` → `users(id)` | `:591` | o nome diz "partner" mas aponta para `users`, não para `partnerships` |
| tabela `interpreter_education` (singular) | `:150` | as outras satélites são plurais (`interpreter_experiences`, `interpreter_certifications`, `interpreter_portfolios`, `interpreter_availabilities`) — e é exactamente aqui que o DAO erra (item 9, B1) |
| `system_configs."group"` | `:516` | palavra reservada de SQL, obriga a aspas em toda e qualquer query |
| `'presential'` vs `'presencial'` | `interpreter_profiles.modality` (`:62`) e `events.type` (`:434`) usam `presential`; `bookings.location_type` (`:258`) usa `presencial` | duas grafias para o mesmo conceito no mesmo schema |
| `now()` vs `timezone('utc'::text, now())` | `triggeers.sql:7` vs defaults das colunas | duas expressões para a mesma intenção |

O commit `ebbe2f5` (2026-03-25) diz "normalize schema to profile-based keys" — a normalização ficou incompleta nos três primeiros casos.

---

### 34. Dezenove índices em falta, em colunas que os ecrãs filtram

**Gravidade:** qualidade · **[VISTO]**

Tabelas sem qualquer índice secundário (`01-database.md` §3): `users`, `languages`, `specialties`, `interpreter_languages`, `interpreter_specialties`, `services`, `interpreter_services`, `documents`, `verification_requests`, `favorites`, `legal_resources`, `success_cases`, `events`, `system_configs`, `opportunities`, `partnerships`, `testimonials`.

Faltas com correspondência directa a filtros de ecrãs: `documents(user_id)`, `documents(status)`, `verification_requests(interpreter_profile_id)`, `verification_requests(status)`, `interpreter_services(interpreter_profile_id)`, `favorites(interpreter_profile_id)`, `testimonials(status)`, `success_cases(is_published)`, `events(status)`, `opportunities(status)`, `articles(author_id)`.

---

### 35. Problemas no `index.html`

**Gravidade:** qualidade · **[VISTO]**

| Problema | `ficheiro:linha` |
|---|---|
| **Duas tags `<title>`**: `Portal interpretes` e `Portal dos Intérpretes \| Academia Grace Mind`. O browser usa a primeira [INFERIDO] | `index.html:7` e `:9` |
| TODO do template Lovable: `<!-- TODO: Set the document title to the name of your application -->` | `index.html:6` |
| `<html lang="en">` com todo o conteúdo e `og:locale` em `pt_PT` — leitores de ecrã escolhem a pronúncia errada | `index.html:2` vs `:29` |
| `og:image`/`twitter:image` apontam para `/og-image.png`, que **não existe** em `public/` (só há `favicon.ico`, `robots.txt`, `placeholder.svg`) | `index.html:28`, `:41` |
| `robots.txt` abre tudo a todos os bots, **sem directiva `Sitemap:`**, e não existe `sitemap.xml` | `public/robots.txt` |

---

### 36. Três nomes diferentes para o mesmo projecto, e instruções de README que não funcionam

**Gravidade:** qualidade · **[VISTO]**

| Fonte | Nome |
|---|---|
| directório do repo | `grace-mind-connect` |
| `package.json:2` | `vite_react_shadcn_ts` (nome por omissão do template Lovable), `version: 0.0.0` |
| `README.md:235` | `cd web-portal_do_interprete-ts` |

As instruções de instalação do `README.md:233-237` (`git clone` + `cd web-portal_do_interprete-ts`) não funcionam como estão.

---

### 37. Dois lockfiles, e fins de linha não normalizados

**Gravidade:** qualidade · **[VISTO]**

- `bun.lockb` (9 Jan 2026) e `package-lock.json` (22 Jun 2026) coexistem — gestor de pacotes ambíguo
- **182 ficheiros aparecem como modificados** no `git status`, e são **exclusivamente** conversão LF→CRLF: `git diff --shortstat` dá `33645 insertions(+), 33645 deletions(-)` (números iguais) e `git diff --ignore-all-space --shortstat` dá **saída vazia**
- `file postcss.config.js src/App.tsx` → `ASCII text, with CRLF line terminators`; as versões em HEAD não têm `\r`
- **não existe `.gitattributes`** para normalizar fins de linha

---

### 38. Mensagem de commit mal formada no histórico

**Gravidade:** qualidade · **[VISTO]**

`git log` → commit `ebbe2f5` (2026-03-25) tem como assunto literal:

```
git commit -m "feat(db): normalize schema to profile-based keys and expand seed data"
```

O comando foi capturado como mensagem.

---

### 39. Seed escreve directamente em `auth.users`

**Gravidade:** qualidade · **[VISTO]**

`supabase/seed.sql` contém um `INSERT INTO auth.users` — escrita directa no schema `auth` gerido pelo Supabase, em vez de criar o utilizador pela API de auth. Os restantes `INSERT` cobrem 34 das 37 tabelas de `public`; sem seed ficam `booking_logs`, `forum_posts` e `system_configs`.

Não há forma de saber se o seed foi executado, nem contra que base de dados (item 3).

---

### 40. Ficheiro `triggeers.sql` com erro de ortografia no nome

**Gravidade:** qualidade · **[VISTO]**

`supabase/triggeers.sql` — dois "e". Sem consequência funcional; registado porque o ficheiro é referenciado em documentação e em qualquer processo manual de aplicação do schema.

---

## Dúvidas que só o remoto resolve

Lista do que ficou em **[DESCONHECIDO]** por causa do item 1, e que constitui o âmbito da segunda passagem da Fase 1 (ver `HANDOFF.md`):

| # | Dúvida |
|---|---|
| D1 | O RLS está activo? Está **forçado** (`relforcerowsecurity`)? Em que tabelas? |
| D2 | Que policies existem, com que comando, roles, `USING` e `WITH CHECK`? Incluindo no schema `storage`. |
| D3 | Que grants têm `anon` e `authenticated` nas tabelas de `public`? |
| D4 | Quantas tabelas tem o remoto, e por que via foi o schema aplicado (ver item 4: o resultado difere entre SQL Editor, `psql` com e sem `ON_ERROR_STOP`)? |
| D5 | O remoto tem as colunas e tabelas que o código espera e o snapshot não tem — `primary_specialty`, `accept_open_requests`, `interpreter_educations` — ou são erros de quem escreveu os tipos à mão (item 9)? |
| D6 | Existem enums Postgres, views ou funções/RPC no remoto que não estão no snapshot? |
| D7 | Que triggers existem, incluindo em `auth.users`? Existe algum trigger de negócio que mantenha as denormalizações do item 16? |
| D8 | Que buckets de storage existem, com que `public`, `file_size_limit`, `allowed_mime_types` e policies? |
| D9 | Existem edge functions implantadas? O que fazem? |
| D10 | Que avisos devolve o `get_advisors` (security e performance)? |
| D11 | Quantas linhas tem cada tabela, e `auth.users`? Há dados reais em produção? |
| D12 | A publicação `supabase_realtime` inclui as tabelas subscritas (item 23)? |
| D13 | O `AdminTeam.tsx` funciona hoje contra o remoto? Se sim, isso é indício de ausência de RLS. |
