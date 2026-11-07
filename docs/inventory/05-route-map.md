# 05 — Mapa de rotas, componentes partilhados, segredos e mocks

> Passo A do plano (`docs/plan/specs/foundation.md` §A), 2026-10-25. Só leitura: nenhum ficheiro de código foi alterado.
> Gerado a partir do grafo de imports de `src/` (imports `@/…` e relativos, transitivos), pelas rotas de `src/routes/*.tsx` e pelo mapa de `docs/plan/architecture.md` §3. Marcas como no `CLAUDE.md`.

---

## 1. Mapa de rotas — cada página e a app nova

| Ficheiro | Rota de hoje | App nova | Rota nova | Nota |
|---|---|---|---|---|
| `src/pages/portal/Home.tsx` | `/`, `/home` | site-web | `/` |  |
| `src/pages/portal/Services.tsx` | `/services` | site-web | `/services` |  |
| `src/pages/portal/HowItWorks.tsx` | `/how-it-works` | site-web | `/how-it-works` |  |
| `src/pages/portal/Impact.tsx` | `/impact` | site-web | `/impact` |  |
| `src/pages/portal/Contact.tsx` | `/contact` | site-web | `/contact` | formulário real no H15 (`support.md`) |
| `src/pages/portal/ForRequesters.tsx` | `/for-requesters` | site-web | `/for-requesters` |  |
| `src/pages/portal/ForInterpreters.tsx` | `/for-interpreters` | site-web | `/for-interpreters` |  |
| `src/pages/portal/Interpreters.tsx` | `/interpreters` | site-web | `/interpreters` | lista pública (D-05 (visitante vê a lista, não o perfil)) |
| `src/pages/portal/Tutorials.tsx` | `/tutorials` | site-web | `/tutorials` |  |
| `src/pages/portal/InterpreterProfile.tsx` | `/interpreters/:slug` | features → requester-web, interpreter-web | `/interpreters/:slug` | sai do site (D-05); no site o cartão leva ao login do requester-web |
| `src/pages/portal/InterpreterVideos.tsx` | `/interpreters/:slug/videos` | features → requester-web, interpreter-web | `/interpreters/:slug/videos` | idem |
| `src/pages/portal/InterpreterArticles.tsx` | `/interpreters/:slug/articles` | features → requester-web, interpreter-web | `/interpreters/:slug/articles` | idem |
| `src/pages/portal/ArticlePage.tsx` | `/interpreters/:slug/articles/:articleSlug` | features → requester-web, interpreter-web | `/interpreters/:slug/articles/:articleSlug` | idem |
| `src/pages/portal/auth/Login.tsx` | `/login` | auth (packages/auth) → requester-web, interpreter-web, admin-web | `/login` | sai do site; o site só tem links |
| `src/pages/portal/auth/Register.tsx` | `/register` | auth → requester-web, interpreter-web | `/register` | idem |
| `src/pages/portal/auth/RecoverPassword.tsx` | `/recover-password` | auth → requester-web, interpreter-web, admin-web | `/recover-password` | idem |
| `src/pages/NotFound.tsx` | `*` (inalcançável hoje) | site-web (e cada app) | `*` | 404 em português alcançável (`04-gaps.md` item 29 (NotFound inalcançável)) |
| `src/pages/Index.tsx` | — (não importado) | nenhuma | — | código morto (`02-screens.md` §7, item 2); não migra |
| `src/pages/dashboard/requester/RequesterLayout.tsx` | `/dashboard/requester` (layout) | requester-web | layout |  |
| `src/pages/dashboard/requester/RequesterOverview.tsx` | `/dashboard/requester` | requester-web | `/` |  |
| `src/pages/dashboard/requester/RequesterRequests.tsx` | `…/requests` | requester-web | `/requests` |  |
| `src/pages/dashboard/requester/NewRequest.tsx` | `…/requests/new` | requester-web | `/requests/new` |  |
| `src/pages/dashboard/requester/RequestDetails.tsx` | `…/requests/:id` | requester-web | `/requests/:id` |  |
| `src/pages/dashboard/requester/BrowseInterpreters.tsx` | `…/interpreters` | requester-web | `/interpreters` |  |
| `src/pages/dashboard/requester/FavoriteInterpreters.tsx` | `…/favorites` | requester-web | `/favorites` |  |
| `src/pages/dashboard/requester/RequestHistory.tsx` | `…/history` | requester-web | `/history` |  |
| `src/pages/dashboard/requester/MyReviews.tsx` | `…/reviews` | requester-web | `/reviews` |  |
| `src/pages/dashboard/requester/RequesterProfile.tsx` | `…/profile` | requester-web | `/profile` |  |
| `src/pages/dashboard/requester/RequesterSettings.tsx` | `…/settings` | requester-web | `/settings` |  |
| `src/pages/dashboard/interpreter/InterpreterLayout.tsx` | `/dashboard/interpreter` (layout) | interpreter-web | layout |  |
| `src/pages/dashboard/interpreter/InterpreterOverview.tsx` | `/dashboard/interpreter` | interpreter-web | `/` |  |
| `src/pages/dashboard/interpreter/InterpreterRequests.tsx` | `…/requests` | interpreter-web | `/requests` |  |
| `src/pages/dashboard/interpreter/InterpreterOpenRequests.tsx` | `…/open-requests` | interpreter-web | `/open-requests` |  |
| `src/pages/dashboard/interpreter/InterpreterRequestDetails.tsx` | `…/requests/:id` | interpreter-web | `/requests/:id` |  |
| `src/pages/dashboard/interpreter/InterpreterSchedule.tsx` | `…/schedule` | interpreter-web | `/schedule` |  |
| `src/pages/dashboard/interpreter/InterpreterAvailability.tsx` | `…/availability` | interpreter-web | `/availability` |  |
| `src/pages/dashboard/interpreter/InterpreterEarnings.tsx` | `…/earnings` | interpreter-web | `/earnings` |  |
| `src/pages/dashboard/interpreter/InterpreterReviews.tsx` | `…/reviews` | interpreter-web | `/reviews` |  |
| `src/pages/dashboard/interpreter/InterpreterProfile.tsx` | `…/profile` | interpreter-web | `/profile` |  |
| `src/pages/dashboard/interpreter/profile/InterpreterProfileOverview.tsx` | `…/profile/overview` | interpreter-web | `/profile/overview` |  |
| `src/pages/dashboard/interpreter/profile/InterpreterProfileExperience.tsx` | `…/profile/experience` | interpreter-web | `/profile/experience` |  |
| `src/pages/dashboard/interpreter/profile/InterpreterProfileServices.tsx` | `…/profile/services` | interpreter-web | `/profile/services` |  |
| `src/pages/dashboard/interpreter/profile/InterpreterProfileContent.tsx` | `…/profile/content` | interpreter-web | `/profile/content` |  |
| `src/pages/dashboard/interpreter/profile/InterpreterProfileReviews.tsx` | `…/profile/reviews` | interpreter-web | `/profile/reviews` |  |
| `src/pages/dashboard/interpreter/profile/InterpreterProfileContact.tsx` | `…/profile/contact` | interpreter-web | `/profile/contact` |  |
| `src/pages/dashboard/interpreter/InterpreterVerification.tsx` | `…/verification` | interpreter-web | `/verification` |  |
| `src/pages/dashboard/interpreter/InterpreterDocuments.tsx` | `…/documents` | interpreter-web | `/verification` (parte do pedido) | arquitectura junta os documentos à verificação; no D move-se para `/verification/documents` até ao H12 (ver AD-005) |
| `src/pages/dashboard/interpreter/InterpreterSettings.tsx` | `…/settings` | interpreter-web | `/settings` |  |
| `src/pages/dashboard/admin/AdminLayout.tsx` | `/dashboard/admin` (layout) | admin-web | layout |  |
| `src/pages/dashboard/admin/AdminOverview.tsx` | `/dashboard/admin` | admin-web | `/` |  |
| `src/pages/dashboard/admin/AdminInterpreters.tsx` | `…/interpreters` | admin-web | `/interpreters` |  |
| `src/pages/dashboard/admin/AdminInterpreterDetails.tsx` | `…/interpreters/:id` | admin-web | `/interpreters/:id` |  |
| `src/pages/dashboard/admin/AdminInterpreterVerifications.tsx` | `…/interpreter-verifications` | admin-web | `/verifications` | fila |
| `src/pages/dashboard/admin/AdminVerificationRequests.tsx` | `…/verification-requests` | admin-web | `/verifications/:id` | a arquitectura funde as três páginas de verificação; no D ver AD-005 |
| `src/pages/dashboard/admin/AdminVerificationHistory.tsx` | `…/verification-history` | admin-web | `/verifications/history` |  |
| `src/pages/dashboard/admin/AdminRequesters.tsx` | `…/requesters` | admin-web | `/requesters` |  |
| `src/pages/dashboard/admin/AdminRequesterDetails.tsx` | `…/requesters/:id` | admin-web | `/requesters/:id` |  |
| `src/pages/dashboard/admin/AdminRequests.tsx` | `…/requests` | admin-web | `/requests` |  |
| `src/pages/dashboard/admin/AdminRequestDetails.tsx` | `…/requests/:id` | admin-web | `/requests/:id` |  |
| `src/pages/dashboard/admin/AdminPayments.tsx` | `…/payments` | admin-web | `/payments` |  |
| `src/pages/dashboard/admin/AdminServices.tsx` | `…/services` | admin-web | `/catalog/services` |  |
| `src/pages/dashboard/admin/AdminTestimonials.tsx` | `…/testimonials` | admin-web | `/content/testimonials` |  |
| `src/pages/dashboard/admin/AdminSuccessCases.tsx` | `…/success-cases` | admin-web | `/content/success-cases` |  |
| `src/pages/dashboard/admin/AdminReports.tsx` | `…/reports` | admin-web | `/reports` |  |
| `src/pages/dashboard/admin/AdminSettings.tsx` | `…/settings` | admin-web | `/settings/config` |  |
| `src/pages/dashboard/admin/AdminTeam.tsx` | `…/team` | admin-web | `/team` | a única página com dados reais hoje (`02-screens.md` §0) |
| `src/pages/dashboard/admin/AdminAudit.tsx` | `…/audit` | admin-web | `/audit` |  |
| `src/pages/dashboard/modules/ModulePlaceholder.tsx` | 13 rotas `…/modules/*` (admin) e `opportunities`, `events`, `legal` (intérprete) | admin-web, interpreter-web | admin: `/community/*`, `/support/tickets`; intérprete: `/opportunities`, `/events`, `/library/legal` | componente de placeholder; cada app recebe a sua cópia até o passo da funcionalidade o substituir (ou sobe para `packages/ui` se usado pelas duas, como manda D) |

**Cobertura:** 68 de 68 ficheiros de `src/pages/**` [VISTO].

Rotas registadas hoje em `src/routes/*.tsx`: 80 atributos `path=` (inclui as rotas aninhadas, os 13+3 `ModulePlaceholder` e os redireccionamentos); `02-screens.md` conta 61 rotas com outro critério (rotas de ecrã, sem contar as entradas de placeholder separadas) [VISTO]. Nenhuma página fica sem destino.

---

## 2. Componentes partilhados

Uso calculado por público: as páginas de cada pasta (`portal` → site, `requester`, `interpreter`, `admin`), mais o que os ficheiros de rotas e o `App.tsx` importam directamente. O `ModulePlaceholder` conta para admin e intérprete [VISTO].

Nota: as páginas públicas do perfil do intérprete (`InterpreterProfile`, `InterpreterVideos`, `InterpreterArticles`, `ArticlePage`) **saem do site para `packages/features`** (D-05 (visitante vê a lista, não o perfil)). Os componentes que só elas usam (por exemplo `VideoModal`) vão com elas para `features`.

| Componente | Usado por | Destino proposto |
|---|---|---|
| `src/components/AboutSection.tsx` | site | fica na app `site` |
| `src/components/AnimatedSection.tsx` | site (e as páginas de perfil que vão para `features`) | `packages/ui` (sem domínio) — corrigido no D1 |
| `src/components/DecorativeBackground.tsx` | site | fica na app `site` |
| `src/components/FloatingButtons.tsx` | site | fica na app `site` |
| `src/components/InterpreterCard.tsx` | requester, site | `packages/features` (tem domínio) |
| `src/components/InterpretersCarousel.tsx` | site | fica na app `site` |
| `src/components/NavLink.tsx` | — | sem uso alcançável → não migra |
| `src/components/PageBanner.tsx` | site | fica na app `site` |
| `src/components/RequestServiceModal.tsx` | site (e as páginas de perfil que vão para `features`) | `packages/features` (tem domínio) — corrigido no D1 |
| `src/components/ServiceDetailsModal.tsx` | site | fica na app `site` |
| `src/components/VideoSection.tsx` | site | fica na app `site` |
| `src/components/VideoTestimonials.tsx` | site | fica na app `site` |
| `src/components/dashboard/ConfirmationModal.tsx` | admin, requester | `packages/ui` (sem domínio) |
| `src/components/dashboard/DataTable.tsx` | — | sem uso alcançável → não migra |
| `src/components/dashboard/EmptyState.tsx` | admin, interpreter, requester | `packages/ui` (sem domínio) |
| `src/components/dashboard/FiltersBar.tsx` | admin, interpreter, requester, site | `packages/ui` (sem domínio) |
| `src/components/dashboard/PageHeader.tsx` | admin, interpreter, requester | `packages/ui` (sem domínio) |
| `src/components/dashboard/RequestNegotiationChat.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/ServiceRequestCard.tsx` | admin, interpreter, requester | `packages/features` (tem domínio) |
| `src/components/dashboard/StatsCard.tsx` | admin, interpreter, requester | `packages/ui` (sem domínio) |
| `src/components/dashboard/StatusBadge.tsx` | admin, interpreter, requester | `packages/ui` (sem domínio) |
| `src/components/dashboard/Timeline.tsx` | admin, interpreter, requester | `packages/ui` (sem domínio) |
| `src/components/dashboard/VideoModal.tsx` | admin, site | `packages/features` (tem domínio) |
| `src/components/dashboard/modals/AcceptRequestModal.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/modals/ApproveInterpreterModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/AuditDetailsModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/AvailabilityEditorModal.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/modals/CancelRequestModal.tsx` | — | sem uso alcançável → não migra |
| `src/components/dashboard/modals/CreateSuccessCaseModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/CreateTestimonialModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/EarningsDetailsModal.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/modals/InterpreterPreviewModal.tsx` | — | sem uso alcançável → não migra |
| `src/components/dashboard/modals/RejectInterpreterModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/RejectRequestModal.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/modals/RequestStatusModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/RequestVerificationModal.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/modals/ReviewInterpreterModal.tsx` | — | sem uso alcançável → não migra |
| `src/components/dashboard/modals/ServiceEditorModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/TeamMemberModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/UploadDocumentModal.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/modals/UserSuspensionModal.tsx` | admin | fica na app `admin` |
| `src/components/dashboard/modals/VerificationRequestDetailsModal.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/profile/EditableList.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/profile/MediaUploader.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/profile/ProfilePreviewCard.tsx` | interpreter | fica na app `interpreter` |
| `src/components/dashboard/profile/ProfileSectionEditor.tsx` | interpreter | fica na app `interpreter` |
| `src/components/layout/DashboardLayout.tsx` | admin, interpreter, requester | `packages/ui` (sem domínio) |
| `src/components/layout/Footer.tsx` | site | fica na app `site` |
| `src/components/layout/Header.tsx` | site | fica na app `site` |
| `src/components/layout/PublicLayout.tsx` | site | fica na app `site` |
| `src/components/theme-provider.tsx` | admin, interpreter, requester, site | `packages/ui` (sem domínio) |
| `src/components/theme-toggle.tsx` | admin, interpreter, requester | `packages/ui` (sem domínio) |

**Primitivos shadcn (`src/components/ui/`):** 49 ficheiros; 26 usados por mais de um público, 18 sem uso alcançável. Sobem todos para `packages/ui` (biblioteca base sem domínio, `architecture.md` §2).

Componentes sem uso alcançável (`NavLink`, `DataTable`, `CancelRequestModal`, `InterpreterPreviewModal`, `ReviewInterpreterModal`): não se movem no passo D. Se um passo de funcionalidade precisar de um equivalente, escreve-o em `packages/ui` ou `features` (registado em AD-005).

---

## 3. Segredos no código

Procura em todos os 668 ficheiros versionados (`git ls-files`), por padrões, **sem imprimir valores** [VISTO]:

| Padrão | Ocorrências | Onde |
|---|---|---|
| JWT (`eyJ…`) | 0 | — |
| URL de projecto Supabase (`https://<ref>.supabase.co`) | 0 | — |
| Chaves `sk_/pk_ (live/test)`, AWS `AKIA…`, GitHub `gh?_…`, `BEGIN PRIVATE KEY` | 0 | — |
| Atribuição literal a `api_key`/`secret`/`token`/`password` com ≥ 12 caracteres | 0 | — |
| `service_role` | 12 | só documentação (`docs/plan/architecture.md`, `data-model.md`, `specs/foundation.md`, `specs/staff-and-config.md`) — a palavra, não uma chave |
| Ref do projecto antigo (`mfobq…`) | 17 | só documentação (`docs/inventory/*`, `claude-code-rules.md`); não é segredo |

Variáveis lidas pelo código: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`src/config/supabase.ts:3-4`) [VISTO].

**O `.env` já não está versionado** neste repositório: `git ls-files | grep -iE '(^|/)\.env'` não devolve nada, e não há `.env*` no disco [VISTO]. O inventário (`04-gaps.md` item 11 (`.env` versionado)) descrevia o repositório antigo; o recomeço eliminou-o. O histórico deste repositório tem 6 commits, todos de 2026-10-25 e todos de documentação depois do primeiro [VISTO]. Zero ocorrências é ausência de prova num scanner por padrões, não prova de ausência: um segredo num formato que os padrões não cobrem passaria.

---

## 4. Mocks — base do seed (D-82)

| Ficheiro | Linhas | Usado por |
|---|---|---|
| `src/core/mocks/auditMocks.ts` | 147 | admin |
| `src/core/mocks/interpreterProfileMocks.ts` | 190 | interpreter |
| `src/core/mocks/interpretersMocks.ts` | 321 | requester, site |
| `src/core/mocks/portalMocks.ts` | 95 | site |
| `src/core/mocks/teamMocks.ts` | 45 | nenhum (o `AdminTeam` já lê dados reais) |
| `src/core/mocks/verificationMocks.ts` | 206 | admin, interpreter |

Dados escritos dentro das páginas (`const x = [` ao nível do ficheiro) [VISTO]: 46 das 68 páginas têm pelo menos um. Por pasta: admin 17, intérprete 10, solicitante 8, portal (site) 11. Lista completa: `grep -lE '^(export )?const [a-zA-Z]+(: [^=]+)? = \[' src/pages -r`.

---

## 5. Divergências entre o inventário e o código

| # | Inventário | Código hoje | Consequência |
|---|---|---|---|
| 1 | `04-gaps.md` item 11: `.env` versionado | não versionado (repositório recomeçado) | o passo B não tem segredos a retirar; AD-001 |
| 2 | `02-screens.md`: 61 rotas | 80 `path=` | só critério de contagem; nenhuma página sem destino |
| 3 | mapa da arquitectura: `…/documents` junta-se a `/verification`; três páginas de verificação do admin fundem-se | hoje são páginas separadas | no passo D movem-se como estão, com rotas provisórias; a fusão é do H12 (AD-005) |

Os restantes factos do `CLAUDE.md` (68 páginas, 1 com dados reais, `Index.tsx` morto, sem guards de rota) confirmam-se [VISTO].
