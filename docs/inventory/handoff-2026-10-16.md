# HANDOFF — Inventário do Portal dos Intérpretes

**Inventário:** 2026-10-15 · **Correcções e `CLAUDE.md`:** 2026-10-16
**Natureza:** só documentação. Nenhum código, schema, dependência ou configuração foi tocado.
**Repositório:** `grace-mind-connect`, branch `main`. Inventário commitado em `87c5a15`; esta sessão acrescenta as correcções da Fase 1 e o `CLAUDE.md`.

---

## 1. O que foi feito

Inventário completo do projecto em quatro fases, para análise fora da sessão do desenho de UI/UX, da base de dados e dos fluxos.

| Fase | Âmbito | Documento | Estado |
|---|---|---|---|
| 0 | Reconhecimento: estrutura, stack, scripts, git, Supabase, auth, deploy | `docs/inventory/00-overview.md` | ✅ completa |
| 1 | Base de dados: tabelas, colunas, constraints, índices, triggers, funções, diagrama ER, schema esperado pelo código | `docs/inventory/01-database.md` | ⚠️ **parcial — só fontes locais** |
| 2 | Ecrãs: 68 páginas, 61 rotas, acessos, dados, formulários, estados, mock vs real | `docs/inventory/02-screens.md` | ✅ completa |
| 3 | Fluxos: papéis, jornadas, máquinas de estado, onde o fluxo parte | `docs/inventory/03-flows.md` | ✅ completa |
| 4 | Lacunas: 41 itens numerados + 13 dúvidas, com evidência e gravidade | `docs/inventory/04-gaps.md` | ✅ completa |

### Regras cumpridas

- ✅ Nenhuma alteração a código, schema, dados, configuração ou dependências
- ✅ Nenhum push. O inventário foi commitado em `87c5a15`; as correcções e o `CLAUDE.md` neste commit
- ✅ Nenhum valor de segredo impresso ou copiado — apenas nomes de variáveis (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) e o project ref, que não é segredo
- ✅ Nenhuma query SQL executada contra nenhuma base de dados
- ✅ Nenhuma ferramenta de escrita do MCP invocada
- ✅ Fins de linha não tocados (os 182 ficheiros com diferenças LF/CRLF ficaram como estavam)
- ✅ Erros encontrados foram registados, não corrigidos
- ✅ Cada afirmação marcada como `[VISTO]`, `[INFERIDO]` ou `[DESCONHECIDO]`, com `ficheiro:linha` nas primeiras

---

## 2. Fontes usadas

### Locais — usadas na totalidade

| Fonte | Detalhe |
|---|---|
| `src/` | 395 ficheiros `.ts`/`.tsx`; 68 páginas, 5 ficheiros de rotas, 38 DAOs, 37 usecases, 37 viewmodels, 19 modais, 8 ficheiros de tipos, 7 de enums, 6 de mocks |
| `supabase/` | `database_schema.sql` (37 tabelas, lido na íntegra), `triggeers.sql`, `seed.sql` |
| Configuração | `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `tailwind.config.ts`, `components.json`, `index.html`, `.gitignore`, `public/robots.txt` |
| `.env` | **só os nomes das variáveis** e o project ref extraído do host da URL. Nenhum valor de chave lido nem reproduzido |
| git | `branch`, `status --porcelain`, `diff --shortstat`, `diff --ignore-all-space`, `log -15`, `remote -v`, `ls-files` |
| `README.md`, `.agent/` | para contexto; `.agent/` é configuração de ferramentas de IA, não do produto |

### Remota — tentada, falhou

**Duas chamadas de leitura ao MCP do Supabase, ambas a metadados da plataforma (não da base de dados):**

| # | Chamada | Resultado |
|---|---|---|
| 1 | `list_projects()` | 3 projectos: `bjdiznuurkdjmxnmzufy` (NaLupa), `vcmhadiotzswzkscfkqo` (dossierdecarreira), `hicuwnzhfdjewjxjqxar` (dossierdecarreira_old). **Nenhum é o Portal.** |
| 2 | `get_project("mfobqukllkxuimcjiqvn")` | `MCP error -32600: You do not have permission to perform this action` |

**`execute_sql` não foi invocado nenhuma vez.** Nenhuma query correu contra nenhuma base de dados — nem contra o alvo (inacessível), nem contra os três projectos listados (não são o alvo).

### Nota sobre o modo do servidor MCP

O conector Supabase desta sessão **não está em read-only**. Não existe configuração local dele (`.mcp.json`, `.claude/settings*.json` ausentes; `.agent/mcp_config.json` só declara `context7` e `shadcn`; `~/.claude.json` só tem `playwright`, noutro projecto) — é um conector claude.ai configurado do lado do servidor. A inferência vem das ferramentas expostas: `apply_migration`, `execute_sql`, `create_project`, `deploy_edge_function`, `create_branch`, `delete_branch`, `merge_branch`, `reset_branch`, `rebase_branch`, `pause_project`, `restore_project`. Em `--read-only` nenhuma delas é exposta.

**A restrição a leitura foi disciplina, não barreira do canal.** Ver §5 para como a tornar estrutural.

---

## 3. O que ficou por verificar, e porquê

### Causa única: o projecto Supabase do Portal não é acessível

A app usa o ref `mfobqukllkxuimcjiqvn` (de `VITE_SUPABASE_URL`). O conector autorizado não tem permissão sobre ele. Causas possíveis, indistinguíveis com as ferramentas autorizadas: o conector está ligado a outra organização; o projecto pertence a outra conta; ou foi apagado/pausado.

### O que isso deixou em branco

| Em `01-database.md` | Estado |
|---|---|
| §9 "Divergências snapshot local vs remoto" | **vazia**, com a razão registada |
| §10 "Exposição (`anon`/`authenticated`)" | **vazia**, com a razão registada |
| RLS activo e forçado, policies, grants | `[DESCONHECIDO — remoto inacessível]` |
| Enums, views, funções/RPC, triggers no remoto | idem |
| Buckets de storage e suas policies | idem |
| Edge functions implantadas | idem |
| `get_advisors` (security e performance) | idem |
| Contagens de linhas e `auth.users` | idem |

### Por que não houve substituto local

Três fontes que normalmente permitiriam inferir o estado real **não existem neste repositório**:

1. **Zero migrations** — não há `supabase/migrations/`, logo não há registo do que foi aplicado.
2. **Zero tipos gerados** — `src/integrations/supabase/types.ts` não existe; nenhum ficheiro tem marcador de tipo gerado; `createClient` é chamado sem genérico (`src/config/supabase.ts:10`). Os 8 ficheiros em `src/type/database/` são escritos à mão. Esta era a via mais provável de espreitar o remoto, e está fechada.
3. **O `database_schema.sql` nunca correu com sucesso de uma só vez** — `:549` cria um índice sobre `payouts(interpreter_profile_id)`, coluna que não existe (é `interpreter_id`, `:342`). O estado resultante depende da via de execução — no SQL Editor do Supabase o erro reverte o lote inteiro (0 tabelas); no `psql` sem `ON_ERROR_STOP` o script continua (37 tabelas, sem esse índice); com `ON_ERROR_STOP=1` pára antes das 3 tabelas declaradas depois dos índices. Como não há registo de como foi aplicado, **não é possível afirmar quantas tabelas o remoto tem** — só que este ficheiro não pode descrever fielmente a produção. Ver `01-database.md` §6.

### A condição de paragem não foi avaliável

Estava definido parar e reportar se a secção "Exposição" mostrasse leitura ou escrita anónima em tabelas com dados (contagem > 0). **Nem a exposição nem as contagens são conhecidas**, pelo que a condição não pôde ser avaliada e não houve paragem.

**Isto não significa ausência de exposição.** Significa ausência de informação. Localmente há 0 RLS e 0 policies em 37 tabelas, e a `anon key` está no bundle do browser. Os dois cenários possíveis — base de dados fechada ou base de dados pública — são indistinguíveis daqui. É o item nº2 de `04-gaps.md`.

### Outras limitações, por desenho da tarefa

| Item | Razão |
|---|---|
| Comportamento em runtime de qualquer ecrã | a aplicação não foi executada (tarefa só de leitura) |
| Se o `StatusBadge` lança de facto o `TypeError` com `status = 'accepted'` | `[INFERIDO]` do código; exigiria executar com dados reais |
| Se os ramos de estado vazio funcionam | inalcançáveis com os dados literais actuais |
| Acessibilidade e responsividade dos ecrãs | fora do âmbito pedido |
| Os 48 primitivos restantes de `src/components/ui/` | biblioteca shadcn/ui instalada por omissão |
| Se a app está publicada, e onde | `[DESCONHECIDO]` — zero config de host, zero CI, nenhum domínio próprio em `src/`, `README.md`, `index.html` ou `robots.txt`. Hipótese não confirmada: pré-visualização Lovable gerida fora do repo (há `lovable-tagger` em `vite.config.ts:4,10`). Nenhuma verificação de rede foi feita |

---

## 4. Próxima tarefa: fechar P1 e P4, e gerar a árvore `docs/`

A segunda passagem da Fase 1 **já não é a próxima tarefa** — passou a pendente (§5), porque continua sem acesso ao projecto remoto. O que vem a seguir não depende desse acesso.

### (a) Fechar as decisões de produto P1 e P4

São as duas que **travam a montagem da base de dados** (`product-explainer.md` §8). Enquanto estiverem abertas, nada se aplica à base — e, pela regra do `CLAUDE.md`, nada que delas dependa é implementado.

**P1 — empresa: uma conta ou uma equipa?**
Uma empresa é uma só conta com NIF, ou é uma organização onde várias pessoas (RH, chefias) fazem e acompanham pedidos em nome da mesma empresa, cada uma com o seu acesso?

| Consequência no modelo | Se for uma conta | Se for uma equipa |
|---|---|---|
| `requester_profiles` | basta como está: 1 perfil ↔ 1 `users` (`UNIQUE user_id`) | precisa de uma entidade "organização" separada do utilizador, e de uma tabela de membros com papéis |
| `bookings.requester_profile_id` | aponta para a conta | tem de distinguir **quem pediu** de **por conta de quem** |
| Histórico e permissões | triviais | quem vê os pedidos dos colegas? quem cancela os de outro? |

**P4 — dinheiro.**
O pagamento passa pela plataforma (solicitante paga ao Portal, o Portal paga ao intérprete e fica com comissão), ou é combinado entre as partes, fora da plataforma? Se passa, por que meios — Multicaixa Express, transferência, outro? A ideia de partida é a plataforma ser aberta aos intérpretes e ganhar com a verificação; falta decidir se há também receita sobre os serviços.

| Consequência no modelo | Se o dinheiro passa pela plataforma | Se não passa |
|---|---|---|
| `payments`, `payouts` | núcleo do sistema; precisam de estados, idempotência, comissão, reconciliação | ficam como registo informativo, ou desaparecem |
| `bookings.total_amount` | é valor a cobrar, decidido pelo servidor | é valor combinado, informativo |
| Fecho do serviço (P6) | passa a ter consequência financeira — quem confirma liberta dinheiro | é só mudança de estado |
| Superfície obrigatória | exige servidor: nenhuma destas escritas pode vir do cliente | não exige |

**Dependência a registar:** P4 depende de **P14 (contactos no perfil)**. Se o telefone e as redes sociais do intérprete aparecerem a qualquer pessoa com conta, o serviço pode ser combinado fora da plataforma, e a receita sobre serviços deixa de ser defensável. Decidir P14 antes, ou em conjunto.

**Resultado esperado:** cada decisão registada em `docs/decisions/` com a razão (ADR), e o `product-explainer.md` §8 actualizado — P1 e P4 saem de "em aberto" e o corpo do documento passa a refleti-las.

### (b) Gerar a árvore `docs/` a partir do `product-explainer.md`

Com P1 e P4 fechadas, o `product-explainer.md` passa a ter base suficiente para se expandir na árvore de documentos reais do projecto: `analysis/`, `product/`, `architecture/`, `domain/`, `flows/`, `technical/`, `integrations/`, `infrastructure/`, `ui/`, `foundation/` e `decisions/` (`working-with-rafael.md` §3).

Ordem que a sequência impõe, não escolha de estilo:

1. **`domain/`** primeiro — é o que P1 e P4 desbloqueiam. O modelo de domínio **decidido**, não o schema actual: o de hoje é um rascunho com 18 divergências face ao que o código espera (`01-database.md` §5.2) e um ficheiro que nunca correu de uma só vez (§6).
2. **`flows/`** — as jornadas por papel, já reconstruídas em `03-flows.md`, agora na forma decidida e não na forma observada. Atenção às 5 definições incompatíveis de estado de pedido (`04-gaps.md` item 8, vocabulários de estado) e aos 9 conceitos com interface e sem tabela (item 19, entidades sem tabela).
3. **`architecture/`** e **`technical/`** — em particular **o que precisa de servidor**. Pela regra do `working-with-rafael.md` §4, tudo o que decide dinheiro, identidade, permissões ou estado de transacção passa pelo servidor; hoje o projecto não tem servidor nenhum — sem API, sem edge functions, sem RPC (`01-database.md` §5.1).
4. **`foundation/`** — autenticação, papéis e RLS: os itens 5 (autenticação não ligada), 6 (zero guards de rota) e 2 (RLS desconhecido) de `04-gaps.md`.
5. As restantes, conforme o âmbito de cada fase.

**Fronteira a respeitar:** `docs/inventory/` descreve o que **existe hoje** e não se reescreve a partir do produto. A árvore nova descreve o que **vai existir**. Quando divergirem, a divergência é registada como item em `04-gaps.md` — como foi feito com o item 41 (perfis de intérprete públicos vs. produto).

### O que fica a aguardar decisão

Além de P1 e P4, continuam abertas P2, P3 e P5–P14 (`product-explainer.md` §8). Não bloqueiam a árvore `docs/`, mas bloqueiam o que delas depender — em particular P6 (fecho do serviço) e P9 (suspensão), que determinam máquinas de estado, e P8 (níveis de administrador), que determina autorização.

---

## 5. Tarefa pendente: segunda passagem da Fase 1

Continua pendente, sem data, **até haver acesso ao projecto remoto**. Os pré-requisitos e as queries abaixo mantêm-se exactamente como estavam — não foram revistos nem reduzidos.

### Pré-requisitos

**1. Acesso ao projecto `mfobqukllkxuimcjiqvn`.**
Verificar em claude.ai qual a conta/organização autorizada no conector Supabase, ou confirmar se o projecto ainda existe. Os três projectos hoje visíveis estão na organização `gcbcjsgzfvzcsuvqmtwc` e nenhum é o Portal.

**2. MCP do Supabase adicionado ao Claude Code com âmbito restrito.**

```
https://mcp.supabase.com/mcp?project_ref=mfobqukllkxuimcjiqvn&read_only=true
```

Com esta URL, o `project_ref` limita o servidor a este único projecto e o `read_only=true` faz com que as ferramentas de escrita **não sejam expostas**. Passa a ser **barreira do canal e não disciplina do agente** — ao contrário do que aconteceu nesta sessão (§2).

### Queries a executar

Todas `SELECT` sobre catálogos e metadados. **Contagens sim, conteúdo de linhas de tabelas de dados não.**

#### 4.1 Tabelas e estado do RLS

```sql
SELECT n.nspname  AS schema,
       c.relname  AS table,
       c.relrowsecurity      AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
ORDER BY n.nspname, c.relname;
```

#### 4.2 Policies, incluindo o schema `storage`

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
ORDER BY schemaname, tablename, policyname;
```

#### 4.3 Grants de `anon` e `authenticated`

```sql
SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('anon','authenticated')
  AND table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;
```

#### 4.4 Colunas

```sql
SELECT table_name, ordinal_position, column_name, data_type,
       character_maximum_length, numeric_precision, numeric_scale,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

#### 4.5 Constraints (PK, FK, UNIQUE, CHECK) com definição

```sql
SELECT n.nspname AS schema, t.relname AS table, c.conname AS constraint,
       c.contype, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t     ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
ORDER BY t.relname, c.contype, c.conname;
```

#### 4.6 Índices

```sql
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname IN ('public','storage')
ORDER BY tablename, indexname;
```

#### 4.7 Enums

```sql
SELECT n.nspname AS schema, t.typname AS enum_type,
       array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
FROM pg_type t
JOIN pg_enum e      ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
GROUP BY n.nspname, t.typname
ORDER BY n.nspname, t.typname;
```

#### 4.8 Views

```sql
SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname NOT IN ('pg_catalog','information_schema')
ORDER BY schemaname, viewname;
```

#### 4.9 Funções e RPC, com definição

```sql
SELECT n.nspname AS schema, p.proname AS function,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer,
       p.proconfig AS config,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public','storage','auth')
ORDER BY n.nspname, p.proname;
```

> Atenção ao `search_path` em `proconfig` das funções `SECURITY DEFINER` — `handle_new_user` não o fixa localmente (`04-gaps.md` item 17).

#### 4.10 Triggers, incluindo em `auth.users`

```sql
SELECT n.nspname AS schema, c.relname AS table, t.tgname AS trigger,
       pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c     ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname IN ('public','auth','storage')
ORDER BY n.nspname, c.relname, t.tgname;
```

#### 4.11 Buckets de storage — só metadados

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets
ORDER BY id;
```

> **Não ler `storage.objects`.** Metadados dos buckets apenas.

#### 4.12 Publicação Realtime (`04-gaps.md` item 23)

```sql
SELECT pubname, schemaname, tablename
FROM pg_publication_tables
ORDER BY pubname, schemaname, tablename;
```

#### 4.13 Contagens de linhas — só números

```sql
SELECT relname AS table, n_live_tup AS estimated_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC, relname;
```

```sql
SELECT count(*) AS auth_users FROM auth.users;
```

#### 4.14 Ferramentas MCP (não SQL)

- `list_tables(project_id, schemas: ['public','storage','auth'], verbose: true)`
- `list_extensions(project_id)`
- `list_migrations(project_id)` — confirmar se o remoto tem histórico de migrations que o repo não tem
- `list_edge_functions(project_id)` e, para cada uma, `get_edge_function(project_id, slug)` — documentar o que faz
- `get_advisors(project_id, type: 'security')` — **resultado completo**
- `get_advisors(project_id, type: 'performance')` — **resultado completo**

### O que escrever com os resultados

Em `docs/inventory/01-database.md`, substituir o conteúdo das três secções hoje marcadas:

| Secção | O que preencher |
|---|---|
| §9 "Divergências snapshot local vs remoto" | comparação tabela a tabela entre o remoto e `supabase/database_schema.sql`. Em particular: quantas tabelas tem o remoto, e por que via foi aplicado (item 4 de `04-gaps.md` — o ficheiro nunca correu de uma só vez, e o resultado difere conforme a via)? existem `primary_specialty`, `accept_open_requests` e a tabela `interpreter_educations`, ou foram erros de quem escreveu os tipos à mão (item 9, dúvida D5)? |
| §10 "Exposição" | por tabela, o que `anon` e `authenticated` conseguem ler e escrever **hoje**, cruzando RLS + policies + grants. Começar pelas 10 tabelas priorizadas que a secção já lista (`payouts`, `documents`, `users`, `payments`, `audit_logs`, `chat_messages`, `verification_requests`, `requester_profiles`, `support_tickets`, `system_configs`) |
| Anexo A "Queries executadas" | substituir "Nenhuma" pelas queries efectivamente corridas, tal como corridas |

Actualizar depois, em `04-gaps.md`: resolver os itens 1, 2 e as 13 dúvidas D1–D13; reavaliar o item 9 (saber de que lado está a verdade em cada uma das 18 divergências) e o item 23.

### Avaliar a condição de paragem

Com a secção "Exposição" preenchida e as contagens conhecidas, verificar a condição que não foi avaliável nesta passagem: **se houver leitura ou escrita anónima em tabelas com contagem > 0, parar e reportar antes de continuar.**

---

## 6. Onde estão os ficheiros

```
CLAUDE.md                         ← instruções do projecto, carregadas em cada sessão
HANDOFF.md                        ← este ficheiro (raiz do repositório)
docs/_source/
├── product-explainer.md          ← o que o produto deve fazer (fonte de verdade) + P1–P14
└── working-with-rafael.md        ← como trabalhamos
docs/inventory/
├── 00-overview.md                ← Fase 0: repo, stack, git, Supabase, auth, deploy, acesso bloqueado
├── 01-database.md                ← Fase 1: schema local, diagrama ER, schema esperado pelo código
├── 02-screens.md                 ← Fase 2: 68 páginas, 61 rotas, dados, formulários, estados
├── 03-flows.md                   ← Fase 3: papéis, jornadas, máquinas de estado
└── 04-gaps.md                    ← Fase 4: 41 lacunas numeradas + 13 dúvidas
```

### Por onde começar a ler

| Objectivo | Ler |
|---|---|
| Panorama rápido | `00-overview.md` §8 (tabela de síntese) |
| Decidir prioridades | `04-gaps.md` — os 7 bloqueantes primeiro (itens 1–6 e 41) |
| Analisar UI/UX | `02-screens.md` §§3–7 (tabelas por grupo de rotas) |
| Analisar o modelo de dados | `01-database.md` §2 (tabela a tabela) e §8 (diagrama ER) |
| Entender o que falta ligar | `01-database.md` §5.2 (código × schema) e `03-flows.md` §7 |
| Entender o produto como funciona hoje | `03-flows.md` §§2–5 (jornadas por papel) |

---

## 7. Os seis factos que enquadram tudo o resto

Resumo do que o inventário encontrou, para quem só ler esta página.

1. **A base de dados pode estar aberta ao público, e não é possível saber.** 0 RLS e 0 policies em 37 tabelas no snapshot local, `anon key` no bundle do browser, e o remoto inacessível. Inclui `payouts.iban` e URLs de cartão de identidade e registo criminal em `documents`.
2. **Não há autenticação em runtime.** A cadeia Supabase está implementada e `auth.viewmodel.ts` não é importado por ficheiro nenhum. `Login.tsx:19-21` é `setTimeout` + toast, e o formulário nem lê os campos.
3. **Não há um único guard de rota.** `/dashboard/admin` abre a qualquer visitante. O papel escolhe-se escrevendo o URL.
4. **Foi construída uma camada de dados completa que quase nada usa.** 38 DAOs, 38 interfaces, 37 usecases, 37 viewmodels — e **1 das 68 páginas** os consome (`AdminTeam.tsx` → `admin_profiles`, `users`). As outras 67 mostram mocks ou dados hardcoded.
5. **O fluxo central do produto não escreve nada.** `NewRequest.tsx`, 544 linhas e 7 passos, termina em `toast.success` + `navigate` (`:106-114`). De 62 transições de estado identificadas, **1** é executada por código — e essa (`AdminTeam`) é circular e sem ponto de entrada, porque o selector de utilizador só mostra quem já é admin (`TeamMemberModal.tsx:77`).
6. **O schema não é fonte de verdade de nada.** Zero migrations, zero tipos gerados, zero enums Postgres (um único CHECK em todo o schema), e um ficheiro que aborta a meio da execução. Entre o que o código espera e o que o snapshot declara há **18 divergências**, nenhuma detectável em build (`strictNullChecks: false`, `data as any`, zero testes).

**Leitura conjunta:** o projecto tem uma UI extensa e coerente (~27 000 linhas, 61 rotas), construída primeiro com mocks; a camada de dados foi adicionada depois, em quatro dias (24–27 Mar 2026), e a ligação entre as duas ficou por fazer. O trabalho está parado desde então. A pergunta mais urgente não é de desenho — é saber se a base de dados está fechada.
