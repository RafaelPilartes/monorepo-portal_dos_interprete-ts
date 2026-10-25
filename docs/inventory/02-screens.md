# 02 — Ecrãs (Fase 2)

**Fonte:** exclusivamente ficheiros locais em `src/`. Nenhuma execução da aplicação, nenhum acesso ao remoto.
**Âmbito:** 68 ficheiros de página em `src/pages/**/*.tsx`, 61 rotas registadas, mais os componentes não alcançados por rota.

Convenção: **[VISTO]** lido no código · **[INFERIDO]** deduzido · **[DESCONHECIDO]** não verificável.

---

## 0. Resumo executivo

| Métrica | Valor |
|---|---|
| Ficheiros de página | **68** [VISTO] |
| Rotas registadas | **61** (12 públicas + 3 auth + 10 solicitante + 18+3 intérprete + 18+10 admin, mais 3 redireccionamentos) |
| Rotas que são `ModulePlaceholder` vazio | **13** |
| Páginas com **dados reais** da base de dados | **1** — `AdminTeam.tsx` |
| Páginas com dados de `@/core/mocks` | **19** |
| Páginas com dados **hardcoded inline** | **~43** |
| Páginas sem dados (layouts, placeholders, auth) | 5 |
| Páginas com **guard de acesso** | **0** |
| Páginas que usam **`react-hook-form`** | **0** |
| Páginas que usam **`zod`** | **0** |
| Páginas com tratamento de **loading** | **1** (`AdminTeam.tsx`) |
| Páginas com tratamento de **erro** de dados | **1** (`AdminTeam.tsx`, parcial) |
| Páginas com estado **vazio** (`EmptyState` ou `length === 0`) | 24 |
| `toast.success`/`error`/`info` em páginas | **49** — quase todos confirmam acções que não escrevem nada |

### Os quatro factos estruturais

1. **Nenhuma rota tem guard.** `AppRoutes.tsx:19-42` monta tudo em paralelo. `/dashboard/admin` abre a qualquer visitante não autenticado. [VISTO]
2. **A identidade do utilizador é hardcoded nos três layouts.** Não há sessão; o nome e email na barra lateral são literais. [VISTO]
3. **`zod` e `react-hook-form` são dependências do `package.json` e não são usados em nenhum ecrã.** A única referência em todo o `src/` é o primitivo `src/components/ui/form.tsx` — que, por sua vez, não é importado por nenhuma página. **Não existe validação de formulários na aplicação.** [VISTO]
4. **O fluxo central da plataforma — criar um pedido — não escreve nada.** `NewRequest.tsx:106-114`: sete passos, e no fim um `toast.success` e um `navigate`. [VISTO]

---

## 1. Guards e autorização

**Não existe nenhum mecanismo de controlo de acesso em nenhum ponto da aplicação.** [VISTO]

| Verificação | Resultado |
|---|---|
| Componente de rota protegida (`ProtectedRoute`, `RequireAuth`, `AuthGuard`) | não existe |
| `Navigate` condicional por sessão em qualquer ficheiro de rotas | nenhum |
| Leitura de sessão nos layouts | nenhuma |
| `useAuthViewModel` / `useCurrentUser` em qualquer página | **zero ocorrências** |

Os três grupos de dashboard montam o layout directamente [VISTO]:
- `src/routes/RequesterRoutes.tsx:16` — `<Route path="/dashboard/requester" element={<RequesterLayout />}>`
- `src/routes/InterpreterRoutes.tsx:25` — `<Route path="/dashboard/interpreter" element={<InterpreterLayout />}>`
- `src/routes/AdminRoutes.tsx:25` — `<Route path="/dashboard/admin" element={<AdminLayout />}>`

**Consequência:** as 46 rotas de dashboard, incluindo todas as 18 de administração (gestão de intérpretes, pagamentos, auditoria, equipa, configurações), estão acessíveis por URL directo a qualquer pessoa. Hoje mostram mocks; no dia em que mostrarem dados reais, mostram-nos a todos. [VISTO quanto à ausência de guard] / [INFERIDO quanto à consequência]

### Identidade hardcoded nos layouts [VISTO]

| Ficheiro:linha | `userRole` | `userName` | `userEmail` |
|---|---|---|---|
| `src/pages/dashboard/admin/AdminLayout.tsx:125-127` | `"admin"` | `"Admin Portal"` | `"admin@portaldosinterpretes.ao"` |
| `src/pages/dashboard/requester/RequesterLayout.tsx:41-43` | `"solicitante"` | `"João Silva"` | `"joao.silva@exemplo.com"` |
| `src/pages/dashboard/interpreter/InterpreterLayout.tsx:81-83` | `"interprete"` | `"Maria Santos"` | `"maria.santos@email.com"` |

`src/components/layout/DashboardLayout.tsx:50-51` define os defaults `'Utilizador'` / `'email@exemplo.com'`, nunca usados porque os três layouts passam sempre valores. [VISTO]

### Menu de utilizador: três ligações quebradas [VISTO] `src/components/layout/DashboardLayout.tsx`

| Linha | Item | Destino | Problema |
|---|---|---|---|
| `:189` | "Meu Perfil" | `` `/dashboard/${userRole}/perfil` `` | **duplamente quebrado**: `userRole` é `solicitante`/`interprete`/`admin` (português) mas as rotas são `requester`/`interpreter`/`admin` (inglês); e o segmento é `perfil` mas a rota é `profile`. Resolve para `/dashboard/solicitante/perfil` → cai no catch-all `/*` → `/home` |
| `:190` | "Configurações" | `/home` | aponta para a homepage pública em vez de `/dashboard/<role>/settings` |
| `:192` | "Sair" | `/home` | é apenas um `<Link>`. **Não chama `signOut`** nem limpa estado. (Não há sessão para terminar, mas o botão é funcionalmente decorativo) |

---

## 2. Formulários e validação

### Não existe validação em nenhum formulário da aplicação. [VISTO]

| Biblioteca | No `package.json` | Usada em ecrãs | Única referência em `src/` |
|---|---|---|---|
| `zod ^3.25.76` | ✅ | ❌ **nenhum** | `src/components/ui/form.tsx` |
| `react-hook-form ^7.61.1` | ✅ | ❌ **nenhum** | `src/components/ui/form.tsx` |
| `@hookform/resolvers ^3.10.0` | ✅ | ❌ **nenhum** | — |

E `src/components/ui/form.tsx` não é importado por nenhuma página. Busca por `useForm`, `zodResolver`, `from 'zod'` em `src/pages/` e `src/components/` (excluindo `ui/`): **zero resultados**. [VISTO]

### Elementos `<form>` com `onSubmit` — apenas 5 ecrãs [VISTO]

| Ecrã | Ficheiro:linha | Validação | O que faz no submit |
|---|---|---|---|
| Login | `portal/auth/Login.tsx:46` | só `required` no HTML (`:56`, `:78`) | `setTimeout(1500)` → `toast.info('…será implementado em breve.')` (`:19-21`). **Nem lê os valores dos inputs** — sem `value`/`onChange`/`name` |
| Registo | `portal/auth/Register.tsx` | `required` no HTML | `// Simulate registration` (`:29`) → `toast.info('…será implementado em breve.')` (`:32`) |
| Recuperar palavra-passe | `portal/auth/RecoverPassword.tsx` | `required` no HTML | `// Simulate password recovery` (`:17`) → toast |
| Contacto | `portal/Contact.tsx:52` | `required` no HTML | `// Simulate form submission` (`:52`) → ecrã de sucesso (`:139`) |
| Perfil do solicitante | `requester/RequesterProfile.tsx:29` | nenhuma | `// Simulate API call` (`:29`) → toast |

Todos os restantes "formulários" da aplicação são campos controlados por `useState` com botões que chamam handlers directos — sem elemento `<form>`, sem submit, sem validação.

### A única validação que existe: presença, no wizard de pedido

`requester/NewRequest.tsx:83-95` — `canProceed()` decide se o botão "Seguinte" está activo:

```ts
case 1: return !!formData.requestType;
case 2: if (formData.requestType === "direct" && !formData.selectedInterpreter) return false;
        return !!formData.serviceType;
case 3: return !!formData.modality;
case 4: return !!formData.date && !!formData.time;
case 5: return formData.modality === "online" ? !!formData.meetingLink : !!formData.location;
case 6: return !!formData.duration;
case 7: return true;
```

É verificação de verdade (`!!`) e nada mais. **Não valida** [VISTO]: que `date` seja futura; que `time` seja um horário válido; que `meetingLink` seja um URL; que `duration` seja um número positivo; nem cruza a disponibilidade do intérprete. O passo 7 devolve sempre `true`.

---

## 3. Portal público — 12 rotas

Layout: `PublicLayout` (`src/components/layout/PublicLayout.tsx`), via `PublicRoutes.tsx:19`.
**Acesso:** público, sem guard (correcto para este grupo).

| # | Rota | Componente (`src/pages/portal/`) | Linhas | O que mostra | Dados: origem e `ficheiro:linha` | Loading | Erro | Vazio |
|---|---|---|---|---|---|---|---|---|
| 1 | `/home` | `Home.tsx` | 487 | hero, serviços, intérpretes em destaque, vídeos, testemunhos, CTA | **MOCK** — `interpreters` de `@/core/mocks/interpretersMocks` (`Home.tsx:8`) + hardcoded inline | ❌ | ❌ | ❌ |
| 2 | `/services` | `Services.tsx` | 276 | catálogo de serviços com modal de detalhe | **HARDCODED** — 2 arrays inline | ❌ | ❌ | ❌ |
| 3 | `/how-it-works` | `HowItWorks.tsx` | 266 | passos do processo para ambos os papéis | **HARDCODED** — 2 arrays inline | ❌ | ❌ | ❌ |
| 4 | `/impact` | `Impact.tsx` | 203 | números de impacto social, casos | **HARDCODED** — 3 arrays inline | ❌ | ❌ | ❌ |
| 5 | `/contact` | `Contact.tsx` | 214 | formulário de contacto + informações | **HARDCODED** — 1 array inline | ❌ | ❌ | ❌ |
| 6 | `/for-requesters` | `ForRequesters.tsx` | 249 | página de captação de solicitantes | **HARDCODED** — 3 arrays inline | ❌ | ❌ | ❌ |
| 7 | `/for-interpreters` | `ForInterpreters.tsx` | 313 | página de captação de intérpretes | **HARDCODED** — 4 arrays inline | ❌ | ❌ | ❌ |
| 8 | `/interpreters` | `Interpreters.tsx` | 303 | directório com filtros e pesquisa | **MOCK** — `interpretersMocks` (`:15`) | ❌ | ❌ | ❌ |
| 9 | `/interpreters/:slug` | `InterpreterProfile.tsx` | **1147** | perfil público completo: bio, serviços, formação, portefólio, avaliações, disponibilidade | **MOCK** — `interpretersMocks` (`:7`) | ❌ | ❌ | ⚠️ 5 verificações de `length === 0` em secções |
| 10 | `/interpreters/:slug/videos` | `InterpreterVideos.tsx` | 288 | galeria de vídeos do intérprete | **MOCK** (`:8`) | ❌ | ❌ | ⚠️ 1 |
| 11 | `/interpreters/:slug/articles` | `InterpreterArticles.tsx` | 369 | lista de artigos do intérprete | **MOCK** (`:7`) | ❌ | ❌ | ⚠️ 1 |
| 12 | `/interpreters/:slug/articles/:articleSlug` | `ArticlePage.tsx` | 247 | artigo completo | **MOCK** (`:5`) | ❌ | ❌ | ❌ |
| 13 | `/tutorials` | `Tutorials.tsx` | 210 | tutoriais em vídeo (LGA) | **MOCK** — `tutorials` de `@/core/mocks/portalMocks` (`:9`) | ❌ | ❌ | ⚠️ 1 |

**Escritas:** nenhuma. `Contact.tsx:52` simula o envio (`// Simulate form submission`) e mostra um ecrã de sucesso sem persistir nada. Não existe tabela de mensagens de contacto no schema. [VISTO]

**Rota com `:slug` sem tratamento de não-encontrado:** as 4 rotas dinâmicas resolvem o slug contra o array de mocks. Se não houver correspondência, nenhuma delas tem ramo de erro ou 404 — o comportamento depende de como o componente lida com `undefined`. Não verificável sem executar. [VISTO quanto à ausência de ramo] / [DESCONHECIDO quanto ao efeito]

---

## 4. Autenticação — 3 rotas

Montadas directamente em `AppRoutes.tsx:26-28`, sem layout.

| Rota | Componente | Linhas | O que mostra | Escreve? | Problemas |
|---|---|---|---|---|---|
| `/login` | `portal/auth/Login.tsx` | 153 | formulário email/password, link de recuperação, painel lateral promocional | **❌ nada** | stub (`:18-21`); inputs sem `value`/`onChange` (`:51-57`, `:73-79`); link "Registe-se aqui" aponta para `/home/register`, rota inexistente (`:115`); "+200 utilizadores activos" hardcoded (`:146`) |
| `/register` | `portal/auth/Register.tsx` | 251 | formulário de registo com escolha de papel | **❌ nada** | stub (`:29-32`) |
| `/recover-password` | `portal/auth/RecoverPassword.tsx` | 127 | pedido de reposição por email | **❌ nada** | stub (`:17`); não há `resetPasswordForEmail` em sítio nenhum do projecto |

A cadeia Supabase de auth existe e está completa (`SupabaseAuthDAO` → `AuthUseCase` → `auth.viewmodel`), e **nenhum destes três ecrãs a importa**. Detalhe em `00-overview.md` §5. [VISTO]

---

## 5. Dashboard do Solicitante — 10 rotas

Layout: `RequesterLayout.tsx` → `DashboardLayout`. **Sem guard.** Identidade hardcoded "João Silva".

| # | Rota (`/dashboard/requester/…`) | Componente | Linhas | O que mostra | Dados | Escreve | Loading | Erro | Vazio |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `` (índice) | `RequesterOverview.tsx` | 261 | cartões de estatísticas, pedidos recentes, intérpretes sugeridos | **HARDCODED** — 3 arrays inline | — | ❌ | ❌ | ⚠️ 2 |
| 2 | `requests` | `RequesterRequests.tsx` | 148 | lista de pedidos com filtros de estado | **HARDCODED** — 1 array inline | — | ❌ | ❌ | ⚠️ 2 |
| 3 | `requests/new` | `NewRequest.tsx` | **544** | **wizard de 7 passos**: tipo de pedido → serviço/intérprete → modalidade → data/hora → local/link → duração → revisão | **MOCK** — `interpretersMocks` (`:20`) + serviços hardcoded | **❌ nada** (ver abaixo) | ❌ | ❌ | ❌ |
| 4 | `requests/:id` | `RequestDetails.tsx` | 319 | detalhe do pedido, cronologia, chat de negociação, acções | **HARDCODED** — objecto inline (`:53` `status: "confirmed"`) | **❌** `handleCancel` (`:102`) | ❌ | ❌ | ❌ |
| 5 | `interpreters` | `BrowseInterpreters.tsx` | 408 | procura de intérpretes com filtros | **MOCK** (`:40`) | — | ❌ | ❌ | ⚠️ 2 |
| 6 | `favorites` | `FavoriteInterpreters.tsx` | 140 | intérpretes favoritos | **MOCK** (`:18`) | **❌** (nada escreve em `favorites`) | ❌ | ❌ | ⚠️ 2 |
| 7 | `history` | `RequestHistory.tsx` | 148 | histórico de pedidos concluídos | **HARDCODED** — 2 arrays inline | — | ❌ | ❌ | ⚠️ 2 |
| 8 | `reviews` | `MyReviews.tsx` | 149 | avaliações feitas pelo solicitante | **HARDCODED** — 2 arrays inline | **❌** | ❌ | ❌ | ⚠️ 2 |
| 9 | `profile` | `RequesterProfile.tsx` | 167 | dados da empresa/solicitante, editável | **HARDCODED** | **❌** `// Simulate API call` (`:29`) → toast | ⚠️ `isLoading` local só para o spinner do botão | ❌ | ❌ |
| 10 | `settings` | `RequesterSettings.tsx` | 190 | notificações, preferências, segurança | **HARDCODED** | **❌** | ⚠️ local | ❌ | ❌ |

### `NewRequest.tsx` — o fluxo central, e não escreve nada [VISTO]

```ts
// NewRequest.tsx:106-114
const handleSubmit = () => {
  const requestTypeLabel = formData.requestType === "direct" ? "direta" : "aberta";
  toast.success(`Solicitação ${requestTypeLabel} criada com sucesso!`, {
    description: formData.requestType === "direct"
      ? `Aguarde a resposta de ${selectedInterpreterData?.name}.`
      : "A solicitação está disponível para todos os intérpretes elegíveis.",
  });
  navigate("/dashboard/requester/requests");
};
```

Sete passos de recolha de dados, 544 linhas, e o `handleSubmit` **não chama nenhum DAO, usecase, viewmodel ou `supabase.from`**. Mostra uma mensagem de sucesso e redirecciona para uma lista que mostra dados hardcoded — onde o pedido recém-"criado" não aparece. [VISTO]

Existe `SupabaseBookingDAO`, `BookingUseCase` e `booking.viewmodel` completos e por ligar. [VISTO]

### Estado vazio: o padrão real

As 24 páginas marcadas com ⚠️ no "Vazio" têm verificações `length === 0` ou usam `EmptyState` (`src/components/dashboard/EmptyState.tsx`). Mas como os dados são arrays literais não vazios, **esses ramos são inalcançáveis hoje**. São tratamento preparado, não tratamento exercido. [VISTO] / [INFERIDO quanto à inalcançabilidade]

---

## 6. Dashboard do Intérprete — 18 rotas + 3 placeholders

Layout: `InterpreterLayout.tsx`. **Sem guard.** Identidade hardcoded "Maria Santos".

| # | Rota (`/dashboard/interpreter/…`) | Componente | Linhas | O que mostra | Dados | Escreve | Loading | Erro | Vazio |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `` (index) | `InterpreterOverview.tsx` | 136 | estatísticas, próximos trabalhos, ganhos | **HARDCODED** — 2 arrays | — | ❌ | ❌ | ❌ |
| 2 | `requests` | `InterpreterRequests.tsx` | 173 | pedidos recebidos, aceitar/recusar | **HARDCODED** — 2 arrays | **❌** 2 toasts | ❌ | ❌ | ⚠️ 7 |
| 3 | `open-requests` | `InterpreterOpenRequests.tsx` | 360 | bolsa de pedidos abertos, candidatura | **HARDCODED** — 2 arrays | **❌** 2 toasts | ❌ | ❌ | ⚠️ 3 |
| 4 | `requests/:id` | `InterpreterRequestDetails.tsx` | 220 | detalhe, aceitar/recusar com motivo | **HARDCODED** (`:19` `status: "pending"`) | **❌** `handleAccept` (`:43-44`), `handleReject` (`:48-49`) — só toasts | ❌ | ❌ | ❌ |
| 5 | `schedule` | `InterpreterSchedule.tsx` | 145 | agenda/calendário de trabalhos | **HARDCODED** — 1 array | — | ❌ | ❌ | ⚠️ 1 |
| 6 | `availability` | `InterpreterAvailability.tsx` | 210 | grelha de disponibilidade semanal | **HARDCODED** — 1 array | **❌** 1 toast | ❌ | ❌ | ❌ |
| 7 | `earnings` | `InterpreterEarnings.tsx` | 131 | ganhos, pagamentos, gráficos | **HARDCODED** — 2 arrays | — | ❌ | ❌ | ❌ |
| 8 | `reviews` | `InterpreterReviews.tsx` | 155 | avaliações recebidas | **HARDCODED** — 2 arrays | — | ❌ | ❌ | ❌ |
| 9 | `profile` | `InterpreterProfile.tsx` | 221 | hub do perfil com navegação para as 6 sub-páginas | **HARDCODED** | **❌** 1 toast | ❌ | ❌ | ❌ |
| 10 | `profile/overview` | `profile/InterpreterProfileOverview.tsx` | 258 | bio, modalidade, tarifa mínima | **HARDCODED** | **❌** 1 toast | ❌ | ❌ | ❌ |
| 11 | `profile/experience` | `profile/InterpreterProfileExperience.tsx` | 374 | experiências, formação, certificações (CRUD local) | **MOCK** — `initialExperiences, initialEducation, initialCertifications` (`:21`) | **❌** `useState` + 1 toast | ❌ | ❌ | ❌ |
| 12 | `profile/services` | `profile/InterpreterProfileServices.tsx` | 233 | serviços e preços (CRUD local) | **MOCK** — `initialServices` (`:29`) | **❌** `useState` + 1 toast | ❌ | ❌ | ❌ |
| 13 | `profile/content` | `profile/InterpreterProfileContent.tsx` | 368 | vídeos e artigos (CRUD local) | **MOCK** — `initialVideos, initialArticles` (`:29`) | **❌** `useState` + 1 toast | ❌ | ❌ | ❌ |
| 14 | `profile/reviews` | `profile/InterpreterProfileReviews.tsx` | 215 | gestão de avaliações recebidas | **MOCK** — `initialReviews` (`:14`) | **❌** 2 toasts | ❌ | ❌ | ❌ |
| 15 | `profile/contact` | `profile/InterpreterProfileContact.tsx` | 244 | contactos e redes sociais | **HARDCODED** (`:23` `linkedin.com/in/maria-santos-lga`) | **❌** 1 toast | ❌ | ❌ | ❌ |
| 16 | `verification` | `InterpreterVerification.tsx` | 421 | estado da verificação, pedidos, submissão | **MOCK** — `mockRequestsForInterpreter` (`:46`), filtrado em `:133` | **❌** | ⚠️ 9 refs a "loading" (spinners locais) | ❌ | ⚠️ 1 |
| 17 | `documents` | `InterpreterDocuments.tsx` | 139 | documentos carregados e estado | **HARDCODED** — 2 arrays | **❌** 1 toast. **Não chama `SupabaseStorageDAO`** | ❌ | ❌ | ❌ |
| 18 | `settings` | `InterpreterSettings.tsx` | 186 | preferências, notificações | **HARDCODED** | **❌** 1 toast | ❌ | ❌ | ❌ |
| 19 | `opportunities` | `ModulePlaceholder` | 21 | "Bolsa de Oportunidades" — ecrã vazio 🚧 | — | — | — | — | — |
| 20 | `events` | `ModulePlaceholder` | 21 | "Eventos e Masterclasses" — ecrã vazio 🚧 | — | — | — | — | — |
| 21 | `legal` | `ModulePlaceholder` | 21 | "Apoio Jurídico e Ético" — ecrã vazio 🚧 | — | — | — | — | — |

### Nota sobre o "CRUD local" das sub-páginas de perfil

As rotas 11–14 têm interface completa de criar/editar/apagar, implementada inteiramente em `useState` sobre os arrays de mock. As alterações vivem na memória do componente e **desaparecem no refresh**. Nenhuma chama `SupabaseInterpreterExperienceDAO`, `SupabaseInterpreterServiceDAO`, `SupabaseArticleDAO` ou `SupabaseInterpreterPortfolioDAO`, todos existentes. [VISTO]

### Nota sobre `accept_open_requests`

A rota 3 (`open-requests`) é a interface da funcionalidade "pedidos abertos". O campo que a controlaria, `accept_open_requests`, existe em `src/type/database/identity.ts:55` e **não existe na tabela `interpreter_profiles`** (ver `01-database.md` §5.2 B5). Ecrã sem coluna. [VISTO]

---

## 7. Dashboard do Administrador — 18 rotas + 10 placeholders

Layout: `AdminLayout.tsx`. **Sem guard.** Identidade hardcoded "Admin Portal".

| # | Rota (`/dashboard/admin/…`) | Componente | Linhas | O que mostra | Dados | Escreve | Loading | Erro | Vazio |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `` (index) | `AdminOverview.tsx` | 166 | KPIs da plataforma, actividade recente | **HARDCODED** — 3 arrays | — | ❌ | ❌ | ❌ |
| 2 | `interpreters` | `AdminInterpreters.tsx` | 256 | tabela de intérpretes, filtros, acções | **HARDCODED** — 2 arrays | **❌** 3 toasts | ❌ | ❌ | ⚠️ 3 |
| 3 | `interpreters/:id` | `AdminInterpreterDetails.tsx` | 210 | ficha completa do intérprete | **HARDCODED** | **❌** 2 toasts | ❌ | ❌ | ❌ |
| 4 | `interpreter-verifications` | `AdminInterpreterVerifications.tsx` | 402 | fila de verificações de intérpretes | **MOCK** — `mockInterpreterVerifications` (`:36`), filtrado `:58` | **❌** 3 toasts | ❌ | ❌ | ⚠️ 3 |
| 5 | `requesters` | `AdminRequesters.tsx` | 208 | tabela de solicitantes | **HARDCODED** — 3 arrays | **❌** 1 toast | ❌ | ❌ | ⚠️ 3 |
| 6 | `requesters/:id` | `AdminRequesterDetails.tsx` | 235 | ficha do solicitante | **HARDCODED** — 2 arrays | **❌** 2 toasts | ❌ | ❌ | ❌ |
| 7 | `requests` | `AdminRequests.tsx` | 184 | todos os pedidos da plataforma | **HARDCODED** — 1 array | **❌** 1 toast | ❌ | ❌ | ⚠️ 9 |
| 8 | `requests/:id` | `AdminRequestDetails.tsx` | 347 | detalhe, histórico de negociação, mudança de estado | **HARDCODED** (`:43` `status: "confirmado"`, `:64-66` negociações) | **❌** `handleStatusChange` (`:99-100`) — só toast | ❌ | ❌ | ❌ |
| 9 | `testimonials` | `AdminTestimonials.tsx` | 191 | moderação de testemunhos | **HARDCODED** — 3 arrays | **❌** 2 toasts | ❌ | ❌ | ⚠️ 3 |
| 10 | `success-cases` | `AdminSuccessCases.tsx` | 203 | gestão de casos de sucesso | **HARDCODED** — 3 arrays | **❌** 2 toasts | ❌ | ❌ | ⚠️ 3 |
| 11 | `reports` | `AdminReports.tsx` | 173 | relatórios e gráficos (Recharts) | **HARDCODED** — 3 arrays | — | ❌ | ❌ | ❌ |
| 12 | `payments` | `AdminPayments.tsx` | 137 | pagamentos e transferências | **HARDCODED** — 3 arrays | — | ❌ | ❌ | ⚠️ 3 |
| 13 | `services` | `AdminServices.tsx` | 143 | catálogo de serviços | **HARDCODED** — 1 array | **❌** 3 toasts | ❌ | ❌ | ⚠️ 3 |
| 14 | `settings` | `AdminSettings.tsx` | 304 | configurações da plataforma | **HARDCODED** | **❌** 1 toast. **Não usa `SupabaseSystemConfigDAO`** | ❌ | ❌ | ❌ |
| 15 | **`team`** | **`AdminTeam.tsx`** | **335** | **gestão de administradores** | ✅ **DADOS REAIS** (ver §8) | ✅ **ESCREVE** | ✅ | ⚠️ parcial | ✅ |
| 16 | `audit` | `AdminAudit.tsx` | 230 | registo de auditoria com filtros | **MOCK** — `mockLogs` de `@/core/mocks/auditMocks` (`:26`), filtrado `:46` | — | ❌ | ❌ | ⚠️ 3 |
| 17 | `verification-requests` | `AdminVerificationRequests.tsx` | **852** | fila completa de pedidos de verificação, estatísticas | **MOCK** — `mockVerificationRequests` (`:55-56`), filtrado `:99`, stats `:204-207` | **❌** 3 toasts | ⚠️ 4 refs locais | ❌ | ⚠️ 3 |
| 18 | `verification-history` | `AdminVerificationHistory.tsx` | 336 | histórico de verificações, receita | **MOCK** — `mockHistory` (`:43`), filtrado `:73`, stats `:113-115` | **❌** 1 toast — "O ficheiro será descarregado em breve." (`:107`), exportação não implementada | ⚠️ 4 locais | ❌ | ⚠️ 3 |
| 19–28 | `modules/{opportunities, library, community, events, training, mentorship, forum, legal, benefits, support}` | `ModulePlaceholder` | 21 | 10 ecrãs vazios 🚧 | — | — | — | — | — |

---

## 8. A única página com dados reais: `AdminTeam.tsx`

`src/pages/dashboard/admin/AdminTeam.tsx`, 335 linhas. É o único ecrã da aplicação ligado à base de dados. [VISTO]

### Dados que lê

| Tabela | Via | `ficheiro:linha` |
|---|---|---|
| `admin_profiles` (+ embed `users`) | `useAdminProfileViewModel().getAllAdminProfiles(limit, offset, search, filters)` | import `AdminTeam.tsx:23`; chamada `:65-70` |

Parâmetros efectivos [VISTO]: `itemsPerPage = 10` (`:54`), `offset = (currentPage-1)*10` (`:56`), `search` livre (`:68`), e filtro por `permission_level` quando o selector não está em "all" (`:59-62`). Paginação por `pagination.total ?? pagination.count ?? 0` (`:75-77`).

Isto desce por `AdminProfileUseCase` → `SupabaseAdminProfileDAO` → `BaseSupabaseDAO.getAll()` → `supabase.from('admin_profiles').select('*, user:users(*)', { count: 'exact' })`. [VISTO]

### Dados que escreve

| Operação | Tabela | Colunas | `ficheiro:linha` |
|---|---|---|---|
| `createAdminProfile` | `admin_profiles` | `user_id`, `permission_level`, `department`, `is_active` | `:105-110` |
| `updateUser` | **`users`** | `role: UserRole.ADMIN` | `:113-116` |
| `updateAdminProfile` (editar) | `admin_profiles` | `permission_level`, `department`, `is_active` | `:93-100` |
| `updateAdminProfile` (alternar estado) | `admin_profiles` | `is_active` (negado) | `:126-131` |

É também o único ponto da aplicação que escreve em `users.role`. [VISTO]

### Estados

| Estado | Tratamento |
|---|---|
| **Loading** | ✅ `isLoading` do React Query → `<Loader2 className="animate-spin">` (`:198-200`) |
| **Vazio** | ✅ `EmptyState` importado (`:4`) e usado |
| **Erro de leitura** | ❌ **não tratado.** O `getAllAdminProfiles` devolve `{ data, isLoading }` (`:65`) — `isError` não é desestruturado nem usado. Um erro de query mostra lista vazia como se não houvesse administradores |
| **Erro de escrita (criar/editar)** | ❌ **falha silenciosa.** `handleSaveMember` tem `catch (error) { console.error(error) }` (`:119-121`) — sem toast. O modal fecha-se em `:118` **antes** do catch, pelo que num erro o modal fecha e nada é dito ao utilizador |
| **Erro de escrita (alternar estado)** | ✅ `catch` com `toast.error('Erro ao alternar estado do administrador.')` (`:135-138`) |

### Fragilidade da operação de dois passos

`handleSaveMember` na criação faz duas escritas sequenciais sem transacção [VISTO] `:105-116`: primeiro `createAdminProfile` em `admin_profiles`, depois `updateUser` em `users`. Se a segunda falhar, fica um `admin_profiles` criado com o `users.role` não actualizado — e o utilizador não é informado, pelo motivo acima. Não há `.rpc()` nem edge function que faça as duas atomicamente (`01-database.md` §5.1). [VISTO] / [INFERIDO quanto ao estado inconsistente resultante]

---

## 9. O `StatusBadge` quebra com os valores reais do schema

`src/components/dashboard/StatusBadge.tsx` é usado em quase todas as listas de pedidos. [VISTO]

`StatusType` (`:3-14`) aceita: `pending`, `approved`, `rejected`, `completed`, `canceled`, `in_progress`, `confirmed`, `active`, `inactive`, `verified`, `unverified`.

`bookings.status` no schema aceita: `pending`, **`accepted`**, `rejected`, `completed`, **`cancelled`**, `in_progress` (`01-database.md` §2.6).

**`accepted` e `cancelled` não estão no `statusConfig`.** E o render não tem fallback [VISTO] `:68-80`:

```ts
const config = statusConfig[status];
return (
  <span className={cn("inline-flex …", config.className, className)}>
    {config.label}
  </span>
);
```

Com `status = 'accepted'` ou `'cancelled'`, `config` é `undefined` e `config.className` (`:75`) lança `TypeError: Cannot read properties of undefined (reading 'className')`. **No dia em que dados reais de `bookings` chegarem a uma destas listas, a página deixa de renderizar.** Hoje não acontece porque os mocks usam o vocabulário do componente. [VISTO quanto ao código] / [INFERIDO quanto ao erro em runtime]

A isto acresce que `cancelled` (schema) e `canceled` (componente) diferem numa letra, e `approved`/`confirmed` (componente) não existem no schema.

---

## 10. Vocabulários de estado incompatíveis

**Cinco definições diferentes do estado de um pedido, nenhuma delas partilhada.** [VISTO]

| Fonte | `ficheiro:linha` | Valores |
|---|---|---|
| Schema (`bookings.status`) | `database_schema.sql:253` | `pending`, `accepted`, `rejected`, `completed`, `cancelled`, `in_progress` |
| Enum oficial do projecto | `src/type/enum/booking.ts` (`BookingStatus`) | idem — **coincide com o schema** ✅ |
| `RequestDetails.tsx` | `requester/RequestDetails.tsx:25` | `pending`, `approved`, `rejected`, `completed`, `canceled`, `in_progress`, `confirmed` |
| `AdminRequests.tsx` | `admin/AdminRequests.tsx:11` | **`pendente`, `confirmado`, `concluido`, `cancelado`** (em português) |
| `InterpreterRequestDetails.tsx` | `interpreter/InterpreterRequestDetails.tsx:14` | `pending`, `confirmed`, `in_progress`, `completed`, `canceled` |
| `verificationMocks.ts` | `core/mocks/verificationMocks.ts:1` | `pending`, `approved`, `rejected`, `expired` |

Cada ecrã redefine `type RequestStatus` localmente. **O `BookingStatus` oficial — o único que coincide com o schema — não é importado por nenhuma página.** Contagem de literais nas páginas, componentes e mocks [VISTO]: `pending` 50, `concluido` 25, `rejected` 23, `pendente` 21, `approved` 21, `completed` 19, `active` 16, `confirmado` 15, `expired` 11, `cancelado` 11, `accepted` 11, `confirmed` 9, `canceled` 6, `cancelled` 2, `in_progress` 1.

Análise detalhada da máquina de estados em `03-flows.md`.

---

## 11. Rotas quebradas e inalcançáveis

| # | Problema | `ficheiro:linha` | Efeito |
|---|---|---|---|
| 1 | `NotFound` **inalcançável** | `AppRoutes.tsx:40-41` | a rota `/*` → `Navigate to="/home"` precede `*` → `<NotFound />`. Qualquer URL inválido vai para a homepage; o 404 nunca aparece |
| 2 | `src/pages/Index.tsx` é **código morto que aponta para rota morta** | `Index.tsx:4` | `<Navigate to="/portal-interpretes" replace />` — essa rota **não existe**. E `Index.tsx` não é importado por nenhum ficheiro de rotas |
| 3 | Link "Registe-se aqui" | `Login.tsx:115` | `/home/register` não existe (a rota é `/register`) → cai em `/*` → `/home` |
| 4 | Link "Meu Perfil" do menu | `DashboardLayout.tsx:189` | `/dashboard/{solicitante\|interprete\|admin}/perfil` — nenhuma existe → `/home` |
| 5 | Link "Configurações" do menu | `DashboardLayout.tsx:190` | vai para `/home` em vez de `/dashboard/<role>/settings` |
| 6 | Link "Sair" | `DashboardLayout.tsx:192` | `<Link to="/home">` sem `signOut()` |
| 7 | `NotFound` em inglês | `NotFound.tsx:15-18` | "Oops! Page not found" / "Return to Home" numa aplicação pt-PT (e inalcançável, por 1) |
| 8 | 13 rotas são `ModulePlaceholder` | `InterpreterRoutes.tsx:49-75`, `AdminRoutes.tsx:55-144` | navegação existente para ecrãs vazios |

---

## 12. Componentes e ecrãs que nenhuma rota alcança

### 12.1 Páginas não alcançadas por nenhuma rota [VISTO]

| Ficheiro | Situação |
|---|---|
| `src/pages/Index.tsx` | não importado por nenhum ficheiro de rotas. Redirecciona para `/portal-interpretes`, rota inexistente |
| `src/pages/NotFound.tsx` | **importado** em `AppRoutes.tsx:2` e registado em `:41`, mas **inalcançável** porque `/*` em `:40` apanha tudo primeiro |

### 12.2 Componentes nunca importados [VISTO]

Verificado por busca do nome de cada componente em todo o `src/`, excluindo a própria declaração:

| Componente | Observação |
|---|---|
| `src/components/NavLink.tsx` | órfão |
| `src/components/dashboard/DataTable.tsx` | órfão — componente de tabela genérico; todas as listas usam tabelas ad-hoc |
| `src/components/dashboard/modals/ReviewInterpreterModal.tsx` | órfão — modal de avaliação de intérprete, nunca aberto |
| `src/components/dashboard/modals/CancelRequestModal.tsx` | órfão — modal de cancelamento, nunca aberto (o `handleCancel` de `RequestDetails.tsx:102` não o usa) |
| `src/components/dashboard/modals/InterpreterPreviewModal.tsx` | órfão |

### 12.3 Primitivos `ui/` não usados

`src/components/ui/form.tsx` é o único ficheiro do projecto que importa `react-hook-form` e `zod`, e **não é importado por nenhuma página** (§2). Os restantes 48 ficheiros de `src/components/ui/` não foram auditados individualmente — é a biblioteca shadcn/ui instalada por omissão e é esperado que haja primitivos não usados. [VISTO quanto ao `form.tsx`] / [DESCONHECIDO quanto aos restantes]

### 12.4 Camada de dados inteira sem consumidor

Além dos componentes, está órfã a maior parte da arquitectura [VISTO] (detalhe em `01-database.md` §5.2 C):

| Camada | Ficheiros | Consumidos por ecrãs |
|---|---|---|
| DAOs Supabase | 38 | **2** (`SupabaseAdminProfileDAO`, `SupabaseUserDAO`) |
| Interfaces de repositório | 38 | idem |
| UseCases | 37 | **2** |
| ViewModels (React Query) | 37 | **2** (`admin-profile.viewmodel`, `user.viewmodel`) |
| `SupabaseStorageDAO` | 1 | **0** — nenhum ecrã carrega ficheiros, incluindo `InterpreterDocuments.tsx` e `MediaUploader.tsx` |
| `SupabaseAuthDAO` + `auth.viewmodel` | 2 | **0** |

---

## 13. Síntese: dados reais vs. mock vs. hardcoded

| Origem dos dados | Páginas | Observação |
|---|---|---|
| **Base de dados (real)** | **1** | `AdminTeam.tsx` → `admin_profiles`, `users` |
| **Mocks centralizados** (`@/core/mocks`) | **19** | `interpretersMocks`, `portalMocks`, `interpreterProfileMocks`, `verificationMocks`, `auditMocks` |
| **Hardcoded inline** | **~43** | arrays e objectos literais no próprio componente |
| Sem dados | 5 | 3 layouts, `ModulePlaceholder`, `Index.tsx` |

### Os 6 ficheiros de mock [VISTO] `src/core/mocks/`

`interpretersMocks.ts`, `portalMocks.ts`, `interpreterProfileMocks.ts`, `verificationMocks.ts`, `auditMocks.ts`, e um `index.ts`.

### As 49 confirmações falsas

49 chamadas a `toast.success` / `toast.error` / `toast.info` nas páginas. Com a excepção das 2 de `AdminTeam.tsx`, **todas confirmam acções que não escrevem nada**. O utilizador vê "Solicitação criada com sucesso", "Status alterado para: X", "Acesso de … desactivado" e nada mudou em sítio nenhum. [VISTO]

---

## 14. O que não foi verificado nesta fase e porquê

| Item | Razão |
|---|---|
| Comportamento em runtime de qualquer ecrã | a aplicação não foi executada (tarefa só de leitura) |
| Se os ramos de estado vazio funcionam | inalcançáveis com os dados literais actuais |
| Se `StatusBadge` lança de facto o `TypeError` | [INFERIDO] do código; exigiria executar com dados reais |
| Comportamento das rotas `:slug` sem correspondência | nenhum ramo de erro no código; efeito depende do runtime |
| Acessibilidade e responsividade dos ecrãs | fora do âmbito pedido para esta fase |
| Os 48 primitivos restantes de `src/components/ui/` | biblioteca de terceiros instalada por omissão |
| Se os ecrãs funcionariam com RLS activo | **[DESCONHECIDO]** — estado de RLS no remoto é desconhecido (`01-database.md` §10) |
