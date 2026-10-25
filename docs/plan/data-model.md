# Modelo de dados — Portal dos Intérpretes

> Todas as tabelas, campos, estados e transições, políticas de acesso e funções. **Cada regra tem um dono**: uma função ou uma restrição, indicada aqui pelo código da regra (`R-…`), que está escrita **uma vez**, na spec respectiva. Este documento diz *onde* a regra vive; a spec diz *o que* ela é.
>
> Base: Postgres do Supabase local (`D-85`). Schema aplicado por `packages/db` (`architecture.md` §5).

---

## 0. Convenções

- **Identificadores em inglês.** Tabelas no plural, colunas em `snake_case`.
- **Chaves:** `id uuid primary key default gen_random_uuid()`, salvo indicação.
- **Datas:** `timestamptz` em UTC. O fuso de apresentação e de cálculo de dias é `Africa/Luanda` (UTC+1, sem horário de Verão), devolvido por `util.app_timezone()`, o único sítio onde está escrito.
- **`created_at` e `updated_at`** em todas as tabelas mutáveis, com o gatilho `util.set_updated_at()`.
- **Dinheiro:** `bigint` em kwanzas inteiros, com `CHECK (… >= 0)` (`D-37`). Colunas terminadas em `_aoa`.
- **Domínios de valores:** `text` com `CHECK (col IN (…))`. **Zero enums Postgres** (mudar um enum exige migrations frágeis).
- **Domínios partilhados** (em `util`):
  - `util.phone_e164`: `text CHECK (VALUE ~ '^\+[1-9][0-9]{7,14}$')`. A normalização (`923000000` → `+244923000000`) é feita **uma vez**, em `@portal/core` (`normalizePhone`), antes de enviar. A base só verifica.
  - `util.nif`: `text CHECK (VALUE ~ '^[0-9A-Z]{9,14}$')`. **Formato provisório**, aceita o NIF de pessoa colectiva (10 dígitos) e o de pessoa singular (formato do BI). A expressão vive também em `@portal/core` (`NIF_PATTERN`); as duas comparam-se em `scripts/verify.py` (`R-CFG-05`).
  - `util.iban_ao`: `text CHECK (VALUE ~ '^AO06[0-9]{21}$')`. Também em `@portal/core` (`IBAN_AO_PATTERN`), comparado em `verify.py` (`R-CFG-05`).
  - `util.slug`: `text CHECK (VALUE ~ '^[a-z0-9]+(-[a-z0-9]+)*$')`.
- **Códigos legíveis** (`PI-2026-000123`) vêm de `util.next_code(prefix)`, com uma sequência por prefixo e ano.
- **Legenda das políticas:** **S** leitura, **I** inserção, **U** actualização, **D** remoção. "API" quer dizer que a escrita só acontece por uma função `SECURITY DEFINER` com `EXECUTE` para `service_role`, chamada pela API. "Coluna" quer dizer `GRANT INSERT/UPDATE (colunas)` a `authenticated`, mais a política RLS indicada.
- **Excepções ao `EXECUTE` só para `service_role`**, todas indicadas pelo nome: funções `STABLE` só de leitura (`catalog.quote_service`, `booking.preview_request_total`, `booking.current_quote`, `directory.is_eligible_for`, `directory.is_profile_complete`) e funções que só mexem em linhas do próprio, com a verificação de `auth_helper.account_id()` dentro (`community.delete_own_content`). Têm `EXECUTE` para `authenticated`.
- **Erros de regra na base:** uma função ou gatilho que recusa por uma regra faz `RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '<CÓDIGO>'`, com o código do catálogo de `api.md` §2 (por exemplo `TOPIC_LOCKED`). O mapeamento de erros da base para o catálogo vive num sítio só (`@portal/core/errors`) e serve a API e as escritas directas da camada de dados.
- **Toda a tabela tem RLS activa e negação por omissão.** Uma tabela sem política é uma tabela sem acesso.

### `auth_helper` — as funções que as políticas usam

Todas `STABLE`, `SECURITY DEFINER`, `search_path = ''`, `EXECUTE` para `authenticated`.

| Função | Devolve |
|---|---|
| `account_id()` | `auth.uid()` se o perfil estiver `active` **e** não houver documentos legais por aceitar, senão `NULL` (`R-ACC-03`, `R-PRIV-02`): assim a RLS bloqueia também as escritas e leituras directas até os termos em vigor serem aceites |
| `is_active()` | `account_id() IS NOT NULL` |
| `is_interpreter()` | existe `identity.interpreter_profiles` da conta |
| `is_requester()` | existe `identity.requester_profiles` da conta, ou é membro activo de uma organização |
| `staff_level()` | o nível activo em `identity.staff_members`, ou `NULL` |
| `is_staff(levels text[])` | `staff_level() = ANY(levels)`; `super_admin` passa sempre |
| `org_role(org uuid)` | o papel activo da conta na organização, ou `NULL` |
| `my_org_ids()` | as organizações onde a conta é membro activo |
| `has_active_badge(account uuid)` | o intérprete tem um selo válido (`R-VER-06`) |
| `can_view_request(request uuid)` | criador, membro da organização do pedido, intérprete com linha em `request_assignments`, ou equipa (`R-REQ-07`) |
| `is_thread_participant(thread uuid)` | `R-REQ-08` |
| `can_view_requester_reviews(requester uuid)` | `R-REV-03` |

---

## 1. `identity`

### `identity.profiles`

Uma linha por conta de `auth.users`. Criada pelo gatilho `identity.handle_new_auth_user()` (`R-ACC-01`): **só** esta linha, nunca papéis.

| Coluna | Tipo | Nota |
|---|---|---|
| `id` | `uuid` PK, FK `auth.users(id)` | |
| `full_name` | `text NOT NULL` | `CHECK (length(trim(full_name)) BETWEEN 2 AND 120)` |
| `phone` | `util.phone_e164` | |
| `avatar_path` | `text` | bucket `avatars` |
| `status` | `text NOT NULL DEFAULT 'active'` | `active`, `suspended`, `anonymized` |
| `suspended_at`, `suspended_reason` | | escritos por `identity.suspend_account` |
| `anonymized_at` | `timestamptz` | |
| `last_active_role` | `text` | `requester`, `interpreter` (`R-ACC-04`) |

**Transições de `status`:** `active → suspended` (`R-ACC-05`), `suspended → active` (`R-ACC-06`), `active|suspended → anonymized` (`R-PRIV-03`). `anonymized` é final.

**Políticas:** S — o próprio, a equipa, e qualquer conta activa para `full_name` e `avatar_path` (via a vista `identity.public_profiles`). O `phone` de um solicitante é visível aos intérpretes **aceites** num pedido dele, pela vista `booking.request_contacts`. U coluna — o próprio: `full_name`, `phone`, `avatar_path`. `status` só pela API.

### `identity.requester_profiles`

O papel de solicitante particular. Criado por `identity.become_requester` (API).

| Coluna | Tipo |
|---|---|
| `account_id` | `uuid` PK, FK `profiles` |
| `nif` | `util.nif` (opcional) |
| `address`, `city` | `text` |

**Políticas:** S — o próprio, a equipa, e intérpretes com uma atribuição **activa** (aceite ou além) num pedido dele. U coluna — o próprio: `nif`, `address`, `city`.

### `identity.interpreter_profiles`

O papel de intérprete. Criado por `identity.become_interpreter` (API), que gera o `slug` (`R-DIR-02`).

| Coluna | Tipo | Nota |
|---|---|---|
| `account_id` | `uuid` PK, FK `profiles` | |
| `slug` | `util.slug UNIQUE NOT NULL` | |
| `bio` | `text` | |
| `years_experience` | `int CHECK (>= 0 AND <= 70)` | |
| `modality` | `text` | `online`, `in_person`, `both` |
| `minimum_hourly_rate_aoa` | `bigint` | indicativo, mostrado no perfil |
| `accepts_negotiation` | `bool NOT NULL DEFAULT true` | `R-NEG-04` |
| `travel_fee_aoa` | `bigint` | `D-17` |
| `city` | `text` | |
| `contact_phone`, `contact_whatsapp` | `util.phone_e164` | visíveis a quem tem conta (`D-51`) |
| `website_url`, `linkedin_url`, `instagram_url`, `facebook_url` | `text` | `CHECK (… ~ '^https://')` |

**Políticas:** S — qualquer conta activa (`D-05`, `D-51`); o visitante anónimo só vê a vista `directory.public_listing`. U coluna — o próprio: tudo menos `account_id` e `slug`.

### `identity.interpreter_payout_details`

| Coluna | Tipo |
|---|---|
| `interpreter_id` | `uuid` PK, FK `interpreter_profiles` |
| `account_holder`, `bank_name` | `text NOT NULL` |
| `iban` | `util.iban_ao NOT NULL` |

**Políticas:** S — o próprio, `finance`. I/U coluna — o próprio. Os repasses guardam uma cópia no momento em que entram na fila (`R-PAY-11`).

### `identity.organizations`

| Coluna | Tipo | Nota |
|---|---|---|
| `name` | `text NOT NULL` | |
| `nif` | `util.nif NOT NULL UNIQUE` | |
| `sector`, `address`, `city`, `website_url` | `text` | |
| `phone` | `util.phone_e164` | |
| `status` | `text NOT NULL DEFAULT 'active'` | `active`, `suspended`, `anonymized` |
| `created_by` | `uuid` FK `profiles` | |

Criada por `identity.create_organization` (API, `R-ORG-01`). **Políticas:** S — membros activos, equipa, e intérpretes com linha num pedido da organização (nome apenas, pela vista). U coluna — `owner` e `admin`: `name`, `sector`, `address`, `city`, `website_url`, `phone`. `nif` e `status` só pela API. `status` muda por `identity.suspend_organization` / `identity.reactivate_organization` (`R-ACC-05`; a suspensão cancela os pedidos da organização como na suspensão de um solicitante, `D-90`).

### `identity.organization_members`

| Coluna | Tipo | Nota |
|---|---|---|
| `organization_id`, `account_id` | PK composta | |
| `role` | `text NOT NULL` | `owner`, `admin`, `member` |
| `status` | `text NOT NULL DEFAULT 'active'` | `active`, `removed` |
| `joined_at`, `removed_at` | `timestamptz` | |

`UNIQUE (organization_id) WHERE role = 'owner' AND status = 'active'` (`R-ORG-03`). Escritas só pela API (`R-ORG-02` a `R-ORG-04`). **S** — membros activos da mesma organização, equipa.

### `identity.organization_invites`

| Coluna | Tipo | Nota |
|---|---|---|
| `organization_id` | FK | |
| `email` | `citext NOT NULL` | bloqueado: só esta conta aceita |
| `role` | `text` | `admin`, `member` |
| `token_hash` | `text NOT NULL` | o token vai por email; guarda-se o hash |
| `invited_by` | FK `profiles` | |
| `expires_at` | `timestamptz NOT NULL` | da configuração (`org_invite_expiry_days`) |
| `status` | `text` | `pending`, `accepted`, `revoked`, `expired` |
| `accepted_by` | FK `profiles` | |

`UNIQUE (organization_id, email) WHERE status = 'pending'`. Escritas pela API (`R-ORG-02`). **S** — `owner`/`admin` da organização, equipa.

### `identity.staff_members`

| Coluna | Tipo |
|---|---|
| `account_id` | `uuid` PK, FK `profiles` |
| `level` | `text NOT NULL`: `super_admin`, `moderator`, `finance`, `request_operator` (`D-60`) |
| `active` | `bool NOT NULL DEFAULT true` |
| `created_by` | FK `profiles` |

Escritas pela API, só `super_admin` (`R-STF-01`, `R-STF-02`). O primeiro `super_admin` vem do script `packages/db/scripts/bootstrap-admin.mjs` (`R-STF-03`). **S** — equipa.

### `identity.legal_documents`

| Coluna | Tipo | Nota |
|---|---|---|
| `kind` | `text` | `terms`, `privacy` |
| `version` | `int NOT NULL` | `UNIQUE (kind, version)` |
| `body` | `text NOT NULL DEFAULT ''` | vazio até a Academia o dar (`PC-05`) |
| `published_at`, `published_by` | | uma versão publicada não se edita (`util.forbid_mutation` depois de publicada) |

**S** — todos, incluindo anónimos (o registo mostra-os). Escritas pela API, `super_admin`.

### `identity.consents`

| Coluna | Tipo |
|---|---|
| `account_id` | FK `profiles` |
| `legal_document_id` | FK `legal_documents` |
| `accepted_at` | `timestamptz NOT NULL` |
| `ip`, `user_agent` | `text` (da API) |

`UNIQUE (account_id, legal_document_id)`. Append-only. Escrito pela API (`R-PRIV-01`, `R-PRIV-02`). **S** — o próprio, equipa.

### `identity.account_deletion_requests`

| Coluna | Tipo | Nota |
|---|---|---|
| `account_id` | FK | |
| `requested_at` | `timestamptz` | |
| `status` | `text` | `refused`, `completed` |
| `refusal_reason` | `text` | o porquê, mostrado ao utilizador |
| `completed_at` | `timestamptz` | |

Escrito por `identity.request_account_deletion` (`R-PRIV-03`). **S** — o próprio, equipa.

### Funções de `identity` (todas `SECURITY DEFINER`, `EXECUTE` para `service_role`, chamadas pela API)

| Função | Dono de |
|---|---|
| `handle_new_auth_user()` (gatilho em `auth.users`) | `R-ACC-01` |
| `create_organization` | `R-ORG-01` |
| `create_invite`, `accept_invite`, `expire_org_invites` (tarefa) | `R-ORG-02` |
| `transfer_ownership`, `set_member_role` | `R-ORG-03` |
| `remove_member` | `R-ORG-04` |
| `suspend_account`, `reactivate_account` | `R-ACC-05`, `R-ACC-06`, `D-90` |
| `suspend_organization`, `reactivate_organization` | `R-ACC-05`, `R-ACC-06`, `D-90` |
| `set_staff_member` | `R-STF-01`, `R-STF-02` |
| `request_account_deletion` | `R-PRIV-03` (recusa ou chama a seguinte) |
| `anonymize_account` | `R-PRIV-03`, `D-96`; nasce em H2 só com `identity` e cada passo que acrescenta dados pessoais estende-a |

---

## 2. `catalog`

| Tabela | Colunas | Nota |
|---|---|---|
| `catalog.languages` | `code text UNIQUE`, `name`, `is_sign_language bool`, `active bool`, `sort int` | seed: `lga` (Língua Gestual Angolana), `pt`, `en`, `fr`, `es`, `kmb` (Kimbundu), `umb` (Umbundu), `kon` (Kikongo), `cjk` (Cokwe) |
| `catalog.specialties` | `slug UNIQUE`, `name`, `description`, `active`, `sort` | seed: saúde, justiça, educação, eventos, conferências, empresarial, religioso, comunicação social |
| `catalog.services` | `slug UNIQUE`, `title`, `description`, `pricing_mode text` (`hourly`, `fixed`), `platform_price_aoa bigint NOT NULL`, `icon`, `active`, `sort` | `platform_price_aoa` é o preço de tabela do pedido gerido (`D-18`) |

**Políticas:** S — todos, incluindo anónimos, só os `active` (a equipa vê todos). Escritas pela API, `moderator` e `super_admin`.

**Regras:** `R-CAT-01` (desactivar em vez de apagar, dono: `catalog.guard_delete`), `R-CAT-02` (o `pricing_mode` não muda depois de usado, dono: gatilho `catalog.guard_service_pricing_mode`).

**Função:** `catalog.quote_service(p_service_id, p_unit_price_aoa, p_duration_minutes, p_config_version_id) → (billable_minutes int, amount_aoa bigint)`. **Dona de `R-REQ-02`.** É a única que calcula o preço de um serviço; o ecrã pede-a por RPC antes de mostrar um total.

---

## 3. `directory`

### Tabelas

| Tabela | Colunas principais | Escrita |
|---|---|---|
| `directory.interpreter_languages` | `interpreter_id`, `language_id` (PK composta), `level` (`native`, `fluent`, `professional`) | coluna — o próprio |
| `directory.interpreter_specialties` | `interpreter_id`, `specialty_id` (PK) | coluna — o próprio |
| `directory.interpreter_services` | `interpreter_id`, `service_id` FK `catalog.services`, `price_aoa bigint CHECK (> 0)`, `description`, `active`; `UNIQUE (interpreter_id, service_id)` | coluna — o próprio |
| `directory.availability_rules` | `interpreter_id`, `weekday int CHECK (0..6)`, `start_time time`, `end_time time`, `CHECK (end_time > start_time)` | coluna — o próprio (`R-DIR-08`) |
| `directory.availability_exceptions` | `interpreter_id`, `day date`, `note`; `UNIQUE (interpreter_id, day)` | coluna — o próprio |
| `directory.education` | `interpreter_id`, `institution`, `degree`, `field`, `start_year int`, `end_year int`, `is_current bool`, `certificate_url` | coluna — o próprio |
| `directory.experiences` | `interpreter_id`, `role`, `organization`, `start_date`, `end_date`, `is_current`, `description`; `CHECK (end_date IS NULL OR end_date >= start_date)` | coluna — o próprio |
| `directory.certifications` | `interpreter_id`, `name`, `issuer`, `issued_on`, `expires_on`, `credential_url` | coluna — o próprio |
| `directory.media_items` | `interpreter_id`, `kind` (`video`, `presentation`, `portfolio`), `title`, `url`, `thumbnail_path`, `description`, `tags text[]`, `status` (`published`, `removed`), `removed_by`, `removed_reason` | coluna — o próprio (sem `status`); remoção pela API (`R-DIR-07`) |
| `directory.articles` | `interpreter_id`, `slug`, `title`, `summary`, `body`, `cover_path`, `tags`, `status` (`published`, `removed`), `published_at`, `removed_by`, `removed_reason`; `UNIQUE (interpreter_id, slug)` | coluna — o próprio (sem `status`); remoção pela API |
| `directory.favorites` | `requester_account_id`, `interpreter_id` (PK), `created_at` | I/D — o próprio solicitante (`R-DIR-10`) |

**Políticas de leitura:** todas estas tabelas — S para qualquer conta activa, excepto `favorites` (só o dono). Os itens com `status = 'removed'` só os veem o dono e a equipa.

### Funções e vistas

| Nome | Dono de |
|---|---|
| `directory.is_profile_complete(account uuid) → bool` | `R-DIR-01` |
| vista `directory.listed_interpreters` | `R-DIR-03`: perfil completo, conta `active`, sem suspensão |
| vista `directory.public_listing` | o que o visitante anónimo vê (`D-05`): nome, fotografia, cidade, línguas, especialidades, modalidade, selo, avaliação média. **Sem** contactos, sem biografia completa |
| vista `directory.interpreter_ratings` | `R-REV-05`: média e número de avaliações reveladas e não escondidas. Calculada, nunca guardada |
| vista `directory.interpreter_badges` | selo activo e data de validade (`R-VER-06`) |
| vista `directory.late_cancellations` | contagem de cancelamentos tardios por conta (`R-LIFE-01`, `R-LIFE-02`) |
| `directory.is_eligible_for(interpreter uuid, request uuid) → (eligible bool, reason text)` | `R-DIR-09` |
| `directory.remove_content(kind, id, reason)` | `R-DIR-07`, `R-COM-02` (API, `moderator`) |

---

## 4. `config`

### `config.platform_versions` — `D-63`

Uma linha por versão. Só uma `published` de cada vez: `UNIQUE (status) WHERE status = 'published'`. Uma versão publicada nunca se edita (`util.forbid_mutation` para `published` e `retired`).

| Coluna | Tipo | Desenvolvimento | Produção |
|---|---|---|---|
| `version_number` | `int UNIQUE` | | |
| `status` | `text` | `draft`, `published`, `retired` | |
| `published_at`, `published_by`, `notes` | | | |
| `request_min_lead_minutes` | `int` | 30 | 30 |
| `urgent_threshold_hours` | `int` | 24 | 24 |
| `max_interpreters_per_request` | `int` | 5 | 5 |
| `two_interpreters_suggest_minutes` | `int` | 60 | 60 |
| `billing_minimum_minutes` | `int` | 60 | 60 |
| `billing_round_minutes` | `int` | 30 | 30 |
| `invite_expiry_hours` | `int` | 48 | 48 |
| `staffing_warning_hours` | `int` | 24 | 24 |
| `overlap_buffer_minutes` | `int` | 30 | 30 |
| `cancellation_free_until_hours` | `int` | 24 | 24 |
| `completion_auto_confirm_hours` | `int` | 48 | 48 |
| `review_window_days` | `int` | 30 | 30 |
| `review_reveal_days` | `int` | 14 | 14 |
| `chat_close_days` | `int` | 7 | 7 |
| `managed_interpreter_share_pct` | `numeric(5,2)` | 80 (fictício) | **vazio** (`PC-02`) |
| `managed_payment_deadline_hours` | `int` | 48 | 48 |
| `managed_refund_full_until_hours` | `int` | 24 | 24 |
| `managed_refund_late_pct` | `numeric(5,2)` | 0 | 0 |
| `verification_fee_aoa` | `bigint` | 15000 (fictício) | **vazio** (`PC-03`) |
| `verification_validity_months` | `int` | 12 | 12 |
| `verification_renewal_notice_days` | `int` | 30 | 30 |
| `verification_refund_on_reject_pct` | `numeric(5,2)` | 0 | 0 |
| `verification_free_resubmissions` | `int` | 1 | 1 |
| `verification_payment_deadline_days` | `int` | 7 | 7 |
| `event_payment_deadline_hours` | `int` | 48 | 48 |
| `event_refund_until_hours` | `int` | 48 | 48 |
| `content_reports_autohide_threshold` | `int` | 3 | 3 |
| `tax_rate_pct` | `numeric(5,2)` | 0 | 0 (`PC-04`) |
| `prices_include_tax` | `bool` | true | true |
| `academia_bank_name`, `academia_iban`, `academia_beneficiary` | `text` | fictícios | **vazios** (`PC-06`) |
| `org_invite_expiry_days` | `int` | 7 | 7 |
| `support_autoclose_days` | `int` | 7 | 7 |
| `mentorship_max_per_mentor` | `int` | 3 | 3 |

Todas as colunas numéricas com `CHECK (>= 0)`, as percentagens com `CHECK (BETWEEN 0 AND 100)`.

| Função | Dono de |
|---|---|
| `config.current_version_id() → uuid` | `R-CFG-03` |
| `config.get(version uuid) → config.platform_versions` | leitura tipada de uma versão |
| `config.require(version uuid, field text)` | `R-CFG-04`: falha com `CONFIG_VALUE_MISSING` se o campo estiver vazio |
| `config.publish_version(id)` (API, `super_admin`) | `R-CFG-01`, `R-CFG-02` |

**Políticas:** S — a versão publicada é legível por todos (o site mostra prazos); os rascunhos só pela equipa. Escritas só pela API.

### `config.verification_document_types`

`code UNIQUE`, `name`, `description`, `required bool`, `active bool`, `sort`. Seed (`PC-07`): `id_card` (BI, obrigatório), `criminal_record` (registo criminal, obrigatório), `academia_training` (certificado da formação da Academia, obrigatório, `D-40`), `other` (opcional). Escritas pela API, `super_admin` e `moderator`.

---

## 5. `booking`

### `booking.requests`

| Coluna | Tipo | Nota |
|---|---|---|
| `code` | `text UNIQUE NOT NULL` | `PI-AAAA-NNNNNN` (`R-REQ-03`) |
| `kind` | `text NOT NULL` | `direct`, `open`, `managed` (`D-10`) |
| `open_mode` | `text` | `first_accept`, `requester_chooses`; obrigatório se `kind = 'open'` (`D-11`) |
| `created_by` | FK `profiles` NOT NULL | |
| `organization_id` | FK `organizations` | `NULL` para particulares |
| `service_id` | FK `catalog.services` NOT NULL | |
| `modality` | `text NOT NULL` | `online`, `in_person` |
| `starts_at` | `timestamptz NOT NULL` | |
| `duration_minutes` | `int NOT NULL CHECK (BETWEEN 15 AND 720)` | |
| `ends_at` | `timestamptz GENERATED ALWAYS AS (starts_at + duration_minutes * interval '1 minute') STORED` | |
| `meeting_link` | `text` | obrigatório se `online` (`D-20`) |
| `address`, `city` | `text` | `address` obrigatório se `in_person` |
| `notes` | `text` | |
| `beneficiary_name`, `beneficiary_contact` | `text` | `D-16`; lidos pela vista `booking.request_details` só por quem pode (`R-REQ-07`) |
| `interpreters_needed` | `int NOT NULL CHECK (>= 1)` | o máximo vem da configuração (`R-REQ-01`) |
| `budget_per_interpreter_aoa` | `bigint` | obrigatório se `open_mode = 'first_accept'` |
| `managed_unit_price_aoa` | `bigint` | preço por intérprete do gerido, fixado na aceitação do orçamento (`R-MAN-03`) |
| `is_urgent` | `bool NOT NULL` | calculado na criação e guardado (`R-REQ-01`) |
| `config_version_id` | FK `config.platform_versions` NOT NULL | `R-CFG-03` |
| `status` | `text NOT NULL` | ver abaixo |
| `approved_by`, `approved_at` | | aprovação da organização (`R-MAN-01`) |
| `cancelled_by`, `cancelled_by_role`, `cancelled_at`, `cancel_reason` | | |

**Restrições:** `CHECK (modality <> 'online' OR meeting_link IS NOT NULL)`, `CHECK (modality <> 'in_person' OR address IS NOT NULL)`, `CHECK ((kind = 'open') = (open_mode IS NOT NULL))`, `CHECK (open_mode IS DISTINCT FROM 'first_accept' OR budget_per_interpreter_aoa IS NOT NULL)`.

**Estados e transições** (só por funções; `booking.log_event` regista cada uma).

*Transições explícitas:*

| De | Para | Dono |
|---|---|---|
| (criação, gerido de `member`) | `awaiting_approval` | `booking.create_request` (`R-REQ-01`, `R-MAN-01`) |
| (criação, gerido sem aprovação) | `quoting` | `booking.create_request` |
| (criação, directo ou aberto) | `awaiting_interpreters` | `booking.create_request` |
| `awaiting_approval` | `quoting` / `cancelled` | `booking.approve_managed_request` / `booking.reject_managed_request` (`R-MAN-01`) |
| `quoting` | `awaiting_interpreters` | `booking.accept_quote` (`R-MAN-03`) |
| qualquer não final, excepto `delivered` e `disputed` | `cancelled` | `booking.cancel_request` (`R-LIFE-01`); `identity.suspend_account` quando o suspenso é o solicitante, e `identity.suspend_organization` quando é a organização (`R-ACC-05`, `D-90`); `booking.on_payment_event` quando a intenção expira (`R-MAN-06`) |
| `awaiting_approval`, `quoting`, `awaiting_interpreters` | `expired` | `booking.expire_unstaffed_requests` (`R-REQ-10`) |

*Estados derivados:* para um pedido que já passou de `quoting` e não está num estado final, `booking.refresh_request_status` (`R-REQ-04`) é a **única** função que escolhe entre `awaiting_interpreters`, `awaiting_payment`, `payment_review`, `confirmed`, `delivered`, `disputed`, `completed` e `cancelled`, por esta ordem de precedência, olhando para as atribuições **activas** (`accepted`, `delivered`, `disputed`, `completed`):

1. alguma activa `disputed` → `disputed`;
2. nenhuma activa, e a hora de fim já passou (todas canceladas numa disputa) → `cancelled`;
3. activas < `interpreters_needed` → `awaiting_interpreters`;
4. gerido, antes da hora de início, sem intenção `confirmed` → `awaiting_payment` (intenção `awaiting_proof`) ou `payment_review` (intenção `proof_submitted`); se não houver intenção viva nem confirmada, `booking.on_payment_event` cria-a (`R-MAN-05`);
5. todas as activas `completed` → `completed`;
6. todas as activas `delivered` ou além → `delivered`;
7. senão → `confirmed`.

É chamada no fim de cada função que muda uma atribuição ou uma intenção de pagamento de um pedido. Depois da hora de início, um gerido com o comprovativo por validar segue a derivação normal (passo 5 a 7); o pagamento acompanha-se na intenção (`D-94`).

Estados finais: `completed`, `cancelled`, `expired`. **O estado do pedido nunca é escrito por mais nenhuma função.**

**Imutáveis depois da primeira aceitação:** `service_id`, `modality`, `starts_at`, `duration_minutes`, `address`, `kind`, `open_mode` (`R-REQ-06`, gatilho `booking.guard_request_immutables`). `meeting_link` muda só por `booking.update_meeting_link`.

**Políticas:** S — `auth_helper.can_view_request(id)`; a vista `booking.request_details` esconde `beneficiary_*`, `address` (mostra só `city`) e `notes` a quem não é criador, membro da organização, intérprete **aceite** ou equipa (`D-95`). A vista `booking.request_contacts` dá aos intérpretes aceites o nome e o telefone de quem criou o pedido. Intérpretes elegíveis veem os pedidos abertos pela vista `booking.open_requests_for_me` (`R-OPN-01`). Escritas só pela API.

### `booking.request_languages`

`request_id`, `language_id` (PK). Pelo menos uma (`R-REQ-01`). Escrita por `booking.create_request`.

### `booking.request_assignments`

Uma linha por intérprete envolvido num pedido: convidado, candidato ou atribuído.

| Coluna | Tipo | Nota |
|---|---|---|
| `request_id`, `interpreter_id` | FK; `UNIQUE (request_id, interpreter_id)` | |
| `origin` | `text NOT NULL` | `invited` (directo), `applied` (aberto), `team_assigned` (gerido) |
| `status` | `text NOT NULL` | ver abaixo |
| `offered_price_aoa` | `bigint` | preço proposto em vigor. Início: no directo e no aberto "eu escolho", `catalog.quote_service` com o preço do intérprete; no aberto "o primeiro que aceitar", o orçamento **tal como está** (`D-92`, sem passar pela fórmula); no gerido, `managed_unit_price_aoa`. Muda com propostas aceites |
| `offered_travel_fee_aoa` | `bigint` | taxa de deslocação proposta (`D-17`); **sempre `0`** no aberto "o primeiro que aceitar" (`D-92`) e no gerido (`R-REQ-02`) |
| `agreed_price_aoa`, `agreed_travel_fee_aoa` | `bigint` | **fixados na aceitação** (`D-14`, `R-DRC-03`) |
| `interpreter_share_aoa` | `bigint` | só no gerido, fixado na aceitação (`R-PAY-13`) |
| `period` | `tstzrange` | `[starts_at, ends_at + overlap_buffer_minutes)`, escrito na aceitação: a margem fica **só depois** de cada serviço (`R-REQ-05`) |
| `invite_expires_at` | `timestamptz` | `R-DRC-02` |
| `responded_at` | `timestamptz` | |
| `decline_reason`, `cancel_reason` | `text` | |
| `cancelled_by_role` | `text` | `requester`, `interpreter`, `staff`, `system` |
| `late_cancellation` | `bool NOT NULL DEFAULT false` | `R-LIFE-01`, `R-LIFE-02` |
| `delivered_at`, `completed_at` | `timestamptz` | |
| `completed_via` | `text` | `requester`, `auto`, `staff` |

**Restrição de sobreposição** (`D-23`, `R-REQ-05`), com `btree_gist`:

```sql
EXCLUDE USING gist (interpreter_id WITH =, period WITH &&)
  WHERE (status IN ('accepted', 'delivered'))
```

**Estados e transições:**

| De | Para | Dono |
|---|---|---|
| (criação) | `invited` | `booking.invite_interpreter` (`R-DRC-01`), `booking.assign_interpreter` (`R-MAN-04`) |
| (criação) | `applied` | `booking.apply_to_request` (`R-OPN-03`) |
| (criação) | `accepted` | `booking.accept_open_request` (`R-OPN-02`, modo "o primeiro que aceitar") |
| `invited` | `accepted` / `declined` | `booking.accept_assignment` (`R-DRC-03`) / `booking.decline_assignment` (`R-DRC-04`) |
| `invited` | `expired` | `booking.expire_invites` (`R-DRC-02`) |
| `applied` | `accepted` / `not_selected` / `withdrawn` | `booking.select_candidate` (`R-OPN-04`) / o mesmo, ou `booking.expire_unstaffed_requests` / `booking.withdraw_application` |
| `invited`, `applied` | `cancelled` | `booking.cancel_request` (o pedido inteiro), `booking.reduce_interpreters_needed` (`R-REQ-09`), `identity.suspend_account` (`R-ACC-05`) |
| `invited`, `applied` | `expired` | `booking.expire_unstaffed_requests` (`R-REQ-10`) |
| `accepted` | `cancelled` | `booking.cancel_assignment` (`R-LIFE-02`), `booking.cancel_request` (`R-LIFE-01`), `identity.suspend_account` (`R-ACC-05`), `booking.expire_unstaffed_requests` (`R-REQ-10`), `booking.on_payment_event` quando a intenção expira (`R-MAN-06`) |
| `accepted` | `delivered` | `booking.mark_delivered` (`R-LIFE-03`) |
| `delivered` | `completed` | `booking.confirm_delivery` / `booking.auto_confirm_deliveries` (`R-LIFE-04`) |
| `accepted`, `delivered` | `disputed` | `booking.open_dispute` (`R-LIFE-05`) |
| `disputed` | `completed` / `cancelled` | `booking.resolve_dispute` (`R-LIFE-06`) |

Atribuições **activas** são as que estão em `accepted`, `delivered`, `disputed` ou `completed`.

**Políticas:** S — o intérprete da linha, quem pode ver o pedido (`can_view_request`), equipa. Escritas só pela API.

### `booking.threads`, `booking.messages`, `booking.thread_reads`

| Tabela | Colunas | Nota |
|---|---|---|
| `booking.threads` | `request_id`, `assignment_id` (NULL no fio solicitante–equipa), `kind` (`requester_interpreter`, `requester_team`), `closes_at` | criadas por `booking.ensure_thread` (`R-REQ-08`); `closes_at` escrito quando o pedido chega a estado final |
| `booking.messages` | `thread_id`, `sender_account`, `sender_role` (`requester`, `interpreter`, `staff`), `body text CHECK (length BETWEEN 1 AND 4000)`, `attachment_path`, `created_at` | **append-only**; I coluna (`thread_id`, `body`, `attachment_path`) com política: participante, fio aberto, `sender_account = auth_helper.account_id()` (gatilho preenche `sender_role`) |
| `booking.thread_reads` | `thread_id`, `account_id` (PK), `last_read_at` | I/U coluna — o próprio |

**S** de `messages` — participantes do fio. **A equipa não lê mensagens directamente na base**: lê pela API, que regista cada leitura (`D-58`, `R-PRIV-05`).

### `booking.proposals` — negociação (`D-13`)

| Coluna | Tipo | Nota |
|---|---|---|
| `thread_id`, `request_id`, `assignment_id` | | `assignment_id` NULL no gerido |
| `proposed_by`, `proposed_by_role` | | `requester`, `interpreter`, `staff` |
| `amount_aoa` | `bigint CHECK (> 0)` | preço por intérprete, **sem** a deslocação |
| `status` | `text` | `open`, `accepted`, `rejected`, `void` |
| `responded_by`, `responded_at` | | |

`UNIQUE (thread_id) WHERE status = 'open'` (`R-NEG-02`). Escritas por `booking.make_proposal` e `booking.respond_proposal` (API, `R-NEG-01` a `R-NEG-05`). **S** — participantes do fio, equipa.

### `booking.disputes`

`assignment_id`, `opened_by`, `opened_by_role`, `reason text NOT NULL`, `status` (`open`, `resolved`), `resolution` (`completed`, `cancelled`), `refund_decision` (`full`, `policy`, `none`; só no gerido), `resolved_by`, `resolved_at`, `notes`. `UNIQUE (assignment_id) WHERE status = 'open'`. API (`R-LIFE-05`, `R-LIFE-06`). **S** — as duas partes, equipa.

### `booking.reviews`

| Coluna | Tipo | Nota |
|---|---|---|
| `assignment_id` | FK | |
| `author_account`, `author_role` | | `requester`, `interpreter` |
| `target_account` | FK `profiles` | `CHECK (author_account <> target_account)` |
| `rating` | `int CHECK (BETWEEN 1 AND 5)` | |
| `comment` | `text CHECK (length <= 2000)` | |
| `submitted_at`, `revealed_at` | `timestamptz` | |
| `hidden`, `hidden_by`, `hidden_reason` | | `R-REV-04` |

`UNIQUE (assignment_id, author_role)`. Escritas pela API (`R-REV-01`); revelação por gatilho e por `booking.reveal_reviews` (`R-REV-02`). **S** — o autor sempre; o resto depois de `revealed_at` e se não `hidden`: avaliações a intérpretes para qualquer conta activa; avaliações a solicitantes só com `can_view_requester_reviews` (`R-REV-03`); equipa sempre.

### `booking.request_events`

Registo de transições, **append-only**: `request_id`, `assignment_id`, `from_status`, `to_status`, `actor_account`, `actor_role`, `reason`, `at`. Escrito só por `booking.log_event`, chamada dentro de cada função de transição (`R-REQ-11`). **S** — quem vê o pedido.

### Funções de `booking` (todas `SECURITY DEFINER`, `EXECUTE` para `service_role`, chamadas pela API, excepto as funções só de leitura indicadas em §0)

`create_request` (`R-REQ-01`, `R-REQ-03`), `refresh_request_status` (`R-REQ-04`), `update_meeting_link` (`R-REQ-06`), `reduce_interpreters_needed` (`R-REQ-09`), `ensure_thread` (`R-REQ-08`), `log_event` (`R-REQ-11`), `invite_interpreter` (`R-DRC-01`), `accept_assignment` (`R-DRC-03`, `R-REQ-05`, `R-PAY-13`), `decline_assignment` (`R-DRC-04`), `apply_to_request` (`R-OPN-03`), `withdraw_application` (`R-OPN-03`), `accept_open_request` (`R-OPN-02`), `select_candidate` (`R-OPN-04`), `make_proposal` / `respond_proposal` (`R-NEG-*`), `current_quote` (`STABLE`; o orçamento em vigor de um gerido: a última proposta aceite, ou o preço de tabela, `R-MAN-02`), `approve_managed_request` / `reject_managed_request` (`R-MAN-01`), `accept_quote` (`R-MAN-03`), `assign_interpreter` (`R-MAN-04`), `on_payment_event` (`R-MAN-05`, `R-MAN-06`), `cancel_request` (`R-LIFE-01`), `cancel_assignment` (`R-LIFE-02`), `mark_delivered` (`R-LIFE-03`), `confirm_delivery` (`R-LIFE-04`), `open_dispute` / `resolve_dispute` (`R-LIFE-05`, `R-LIFE-06`), `submit_review` / `hide_review` (`R-REV-01`, `R-REV-04`), `preview_request_total` (`STABLE`, `R-REQ-02`), `notify_unread_messages` (tarefa, aviso `chat_message`, `R-NOT-02`).

**Vistas de `booking`:** `request_details` (`R-REQ-07`, `D-95`), `request_contacts` (contacto de quem criou, para intérpretes aceites), `open_requests_for_me` (`R-OPN-01`), `requester_ratings` (média e contagem das avaliações reveladas a um solicitante, legível nas condições de `R-REV-03`).

---

## 6. `billing`

### `billing.payment_intents`

| Coluna | Tipo | Nota |
|---|---|---|
| `context` | `text NOT NULL` | `managed_request`, `verification`, `event_registration` |
| `subject_id` | `uuid NOT NULL` | o pedido, o pedido de verificação ou a inscrição |
| `payer_account` | FK `profiles` | quem criou o assunto (o pedido, a verificação, a inscrição). Numa organização, o comprovativo só o enviam `owner`/`admin` (`R-PAY-04`) |
| `organization_id` | FK | quando paga uma organização |
| `amount_base_aoa`, `tax_aoa`, `amount_total_aoa` | `bigint NOT NULL` | de `billing.split_amount` (`R-PAY-03`); `CHECK (amount_base_aoa + tax_aoa = amount_total_aoa)` |
| `config_version_id` | FK | |
| `reference` | `text UNIQUE NOT NULL` | `PAG-AAAA-NNNNNN`, a escrever no descritivo da transferência |
| `bank_snapshot` | `jsonb NOT NULL` | banco, IBAN e beneficiário da Academia no momento (`PC-06`) |
| `status` | `text NOT NULL` | `awaiting_proof`, `proof_submitted`, `confirmed`, `cancelled`, `expired` |
| `due_at` | `timestamptz NOT NULL` | |
| `confirmed_by`, `confirmed_at` | | |
| `subject_cancelled_at` | `timestamptz` | o assunto foi cancelado com o comprovativo já enviado (`R-PAY-06`) |
| `refund_due_on_confirm_aoa` | `bigint` | reembolso calculado no cancelamento, a criar se o comprovativo vier a ser aceite |

`UNIQUE (context, subject_id) WHERE status IN ('awaiting_proof', 'proof_submitted', 'confirmed')` — **no máximo uma intenção viva ou confirmada por coisa** (`R-PAY-02`).

**Transições:** criação → `awaiting_proof` (`billing.create_intent`, `R-PAY-01`); `awaiting_proof` → `proof_submitted` (`billing.submit_proof`, `R-PAY-04`); `proof_submitted` → `confirmed` ou `awaiting_proof` (`billing.review_proof`, `R-PAY-05`); `awaiting_proof` → `expired` (`billing.expire_intents`, `R-PAY-06`; **`proof_submitted` nunca expira**); `awaiting_proof` → `cancelled` (o assunto foi cancelado; `billing.cancel_intent_for_subject`); `proof_submitted` com o assunto cancelado → mantém-se, com `subject_cancelled_at`; ao ser aceite passa a `confirmed` e cria logo o reembolso `refund_due_on_confirm_aoa`; ao ser recusado passa a `cancelled`. Cada mudança de estado chama `<contexto>.on_payment_event` (`booking`, `verification`, `community`), que faz o assunto reagir. O estado de reembolso **não é uma coluna**: é a soma de `refunds` (vista `billing.intent_balances`).

**S** — o pagador, membros `owner`/`admin` da organização pagadora, `finance`. Escritas só pela API.

### `billing.payment_proofs`

`intent_id`, `file_path` (bucket `payment-proofs`), `uploaded_by`, `uploaded_at`, `review_status` (`pending`, `accepted`, `rejected`), `rejection_reason`, `reviewed_by`, `reviewed_at`. `UNIQUE (intent_id) WHERE review_status = 'pending'`. API. **S** — como a intenção.

### `billing.refunds`

`intent_id`, `assignment_id` (quando o reembolso é de uma atribuição, `D-91`), `amount_aoa CHECK (> 0)`, `reason_code` (`managed_cancel_early`, `managed_cancel_late`, `managed_reduce`, `provider_failure`, `suspension`, `dispute`, `verification_rejected`, `event_cancelled`, `event_cancel_early`, `manual`), `note text` (obrigatória nos manuais), `policy_snapshot jsonb`, `status` (`pending`, `paid`), `created_by` (conta ou `NULL` = sistema), `paid_reference`, `paid_by`, `paid_at`.

**A soma dos reembolsos de uma intenção nunca passa o total** (`R-PAY-07`, dono `billing.create_refund`, com `SELECT … FOR UPDATE` na intenção). **S** — como a intenção. API.

### `billing.payouts`

`assignment_id UNIQUE`, `interpreter_id`, `amount_aoa`, `status` (`queued`, `paid`, `cancelled`), `payout_details_snapshot jsonb`, `paid_reference`, `paid_by`, `paid_at`, `cancelled_reason`. Criado por `billing.queue_payout` (`R-PAY-10`). **S** — o intérprete, `finance`. API.

### `billing.receipts`

`number text UNIQUE` (`RC-AAAA-NNNNNN`), `kind` (`payment`, `refund`), `intent_id`, `refund_id`, `amount_aoa`, `issued_to_name`, `issued_at`, `payload jsonb` (cópia dos dados mostrados). Imutável. Emitido por `billing.issue_receipt` (`R-PAY-12`). **S** — como a intenção.

### Funções de `billing`

`split_amount(base, version) → (base, tax, total)` (`R-PAY-03`, **a única que faz esta conta**), `managed_interpreter_share(price, version)` (`R-PAY-13`), `create_intent` (`R-PAY-01`), `submit_proof` (`R-PAY-04`), `review_proof` (`R-PAY-05`), `expire_intents` (`R-PAY-06`), `create_refund` / `mark_refund_paid` (`R-PAY-07` a `R-PAY-09`), `queue_payout` / `mark_payout_paid` / `cancel_payout` (`R-PAY-10`, `R-PAY-11`), `issue_receipt` (`R-PAY-12`), `managed_refund_amount(request, assignment?, cause)` (`R-PAY-09`, `D-91`; **a única** que calcula o reembolso de um gerido, usada também pelo ecrã de cancelamento por RPC só de leitura através da API), `cancel_intent_for_subject` (`R-PAY-06`), `warn_payment_review` (tarefa, `D-94`).

---

## 7. `verification`

| Tabela | Colunas | Nota |
|---|---|---|
| `verification.requests` | `interpreter_id`, `kind` (`first`, `renewal`), `status`, `submitted_at`, `resubmissions_used int DEFAULT 0`, `decided_by`, `decided_at`, `decision_notes`, `config_version_id` | `UNIQUE (interpreter_id) WHERE status IN ('draft', 'awaiting_payment', 'under_review', 'needs_changes')` (`R-VER-01`) |
| `verification.documents` | `request_id`, `document_type_id`, `file_path` (bucket `verification-docs`), `original_name`, `uploaded_at`, `review_status` (`pending`, `accepted`, `rejected`), `review_notes` | |
| `verification.badges` | `interpreter_id`, `request_id`, `valid_from`, `valid_until`, `revoked_at`, `revoked_by`, `revoke_reason` | |

**Estados de `verification.requests`:**

| De | Para | Dono |
|---|---|---|
| (criação) | `draft` | `verification.create_request` (`R-VER-01`) |
| `draft` | `awaiting_payment` | `verification.submit` (`R-VER-02`, `R-VER-03`); grava aqui o `config_version_id` |
| `awaiting_payment` | `under_review` | `verification.on_payment_event`, quando a intenção fica `confirmed` |
| `awaiting_payment` | `draft` | `verification.on_payment_event`, quando a intenção expira (`R-PAY-06`) |
| `under_review` | `approved` / `rejected` / `needs_changes` | `verification.decide` (`R-VER-04`) |
| `needs_changes` | `under_review` | `verification.resubmit` (`R-VER-05`) |
| `draft`, `awaiting_payment`, `needs_changes` | `cancelled` | `verification.cancel` (o próprio); na intenção viva, `billing.cancel_intent_for_subject` |
| `under_review` | `cancelled` | `verification.cancel` pela equipa (`moderator`), com motivo; reembolso só manual |

Aprovar cria o selo (`R-VER-06`).

**Políticas:** S — o próprio e `moderator`; os documentos idem, e cada abertura de documento pela equipa é feita por URL assinado emitido pela API, que regista na auditoria (`R-VER-09`). Escritas pela API, salvo a criação do rascunho e o upload de documentos, que também passam pela API (URL assinado).

---

## 8. `community`

| Tabela | Colunas principais | Escrita | Leitura |
|---|---|---|---|
| `opportunities` | `title`, `description`, `requirements`, `kind` (`freelance`, `contract`, `full_time`, `volunteer`), `location`, `is_remote`, `deadline`, `posted_by`, `organization_id`, `status` (`draft`, `open`, `closed`, `filled`, `removed`) | API (`R-OPP-01`, `R-OPP-02`) | intérpretes (abertas); quem publicou; equipa |
| `opportunity_languages` | `opportunity_id`, `language_id` | API | como a oportunidade |
| `opportunity_applications` | `opportunity_id`, `interpreter_id` (`UNIQUE` par), `message`, `status` (`submitted`, `shortlisted`, `rejected`, `withdrawn`, `hired`) | API (`R-OPP-03`) | o candidato; quem publicou; equipa |
| `events` | `title`, `description`, `kind` (`online`, `in_person`, `hybrid`), `starts_at`, `ends_at` (`CHECK ends_at > starts_at`), `location`, `meeting_link`, `capacity`, `price_aoa`, `audience` (`interpreters`, `all`), `cover_path`, `status` (`draft`, `published`, `cancelled`, `completed`) | API (`R-EVT-01`) | publicados: conforme `audience`; equipa |
| `event_registrations` | `event_id`, `account_id` (`UNIQUE` par activo), `status` (`pending_payment`, `registered`, `cancelled`, `attended`, `no_show`) | API (`R-EVT-02` a `R-EVT-05`) | o próprio; equipa |
| `courses` | `title`, `provider`, `description`, `url`, `cover_path`, `tags`, `active` | API (`R-CRS-01`) | intérpretes |
| `mentor_profiles` | `interpreter_id` PK, `areas text[]`, `bio`, `active` | API (`R-MEN-01`) | intérpretes |
| `mentorships` | `mentor_id`, `mentee_id`, `request_message`, `status` (`requested`, `approved`, `rejected`, `ended`), `approved_by`, `started_at`, `ended_at`, `end_reason` | API (`R-MEN-02`, `R-MEN-03`) | as duas partes; equipa |
| `library_resources` | `section` (`library`, `legal`), `kind` (`guide`, `template`, `legislation`, `ethics_code`, `faq`), `title`, `summary`, `body`, `file_path`, `published bool` | API (`R-LIB-01`) | intérpretes (publicados); equipa |
| `forum_categories` | `slug`, `name`, `description`, `sort`, `active` | API | intérpretes |
| `forum_topics` | `category_id`, `author_id`, `title`, `body`, `is_pinned`, `is_locked`, `status` (`visible`, `removed`), `edited_at`, `solution_post_id` | I/U coluna — o autor (`title`, `body`); o resto pela API (`R-FOR-*`) | intérpretes |
| `forum_posts` | `topic_id`, `author_id`, `body`, `status`, `edited_at` | I/U coluna — o autor (`body`) | intérpretes |
| `feed_posts` | `author_id`, `body`, `image_path`, `status`, `edited_at` | I/U coluna — o autor intérprete | qualquer conta activa (`D-77`) |
| `feed_comments` | `post_id`, `author_id`, `body`, `status` | I coluna — intérpretes (`R-FEED-02`) | qualquer conta activa |
| `feed_reactions` | `post_id`, `account_id` (PK), `created_at` | I/D — intérpretes | qualquer conta activa |
| `content_reports` | `target_type` (`feed_post`, `feed_comment`, `forum_topic`, `forum_post`, `article`, `media_item`, `review`), `target_id`, `reporter_id`, `reason`, `status` (`open`, `dismissed`, `actioned`), `handled_by`, `handled_at`; `UNIQUE (target_type, target_id, reporter_id)` | I coluna — qualquer conta activa; tratamento pela API (`R-COM-01`) | o denunciante; `moderator` |
| `partners` | `name`, `logo_path`, `website_url`, `description`, `active` | API (`R-BEN-*`) | intérpretes com selo activo; equipa |
| `benefits` | `partner_id`, `title`, `description`, `code`, `discount_pct`, `terms`, `valid_from`, `valid_until`, `active` | API | **só intérpretes com selo activo** (`D-78`, `R-BEN-01`); equipa |
| `testimonials` | `author_name`, `author_role`, `content`, `rating`, `status` (`pending`, `approved`, `rejected`), `is_featured`, `approved_by`, `approved_at` | API (`R-ADM-04`) | aprovados: todos; equipa |
| `success_cases` | `title`, `summary`, `body`, `cover_path`, `is_published`, `published_at` | API | publicados: todos |
| `tutorials` | `title`, `description`, `video_url`, `thumbnail_path`, `sort`, `is_published` | API | publicados: todos |
| `lga_video_slots` | `slot_key text UNIQUE`, `title`, `video_url` | API (`D-83`, `R-ADM-04`) | todos |

Contagens (respostas de um tópico, gostos de um post, inscritos num evento) são **vistas**, nunca colunas.

**Funções de `community`:** `register_for_event` (`R-EVT-02`, `FOR UPDATE` no evento), `cancel_registration` (`R-EVT-03`), `cancel_event` (`R-EVT-05`), `complete_past_events` (`R-EVT-04`), `close_expired_opportunities` (`R-OPP-02`), `mark_solution` (`R-FOR-04`), `remove_content` (`R-COM-02`), `delete_own_content(target_type, target_id)` (`R-FOR-03`; `EXECUTE` para `authenticated`; só o autor, só de `visible` para `removed`, nunca desfaz uma remoção da equipa), `is_hidden_by_reports(target_type, target_id) → bool` (`R-COM-01`: verdadeiro com `content_reports_autohide_threshold` denúncias abertas; usada nas políticas de leitura de todo o conteúdo denunciável, excepto para o autor e a equipa).

### `analytics`

Só funções `STABLE` e vistas, sem tabelas, para os relatórios do admin (`R-ADM-02`): `analytics.report_overview(from, to)`, `report_requests`, `report_payments`, `report_verifications`. Cada uma devolve o período pedido e o anterior do mesmo tamanho, com listas vazias e `NULL` onde não houve dados. `EXECUTE` só para `service_role` (chamadas pela API, que verifica o nível).

---

## 9. `support`

| Tabela | Colunas | Escrita | Leitura |
|---|---|---|---|
| `tickets` | `code` (`SUP-AAAA-NNNNNN`), `opened_by`, `category` (`technical`, `billing`, `account`, `complaint`, `suggestion`, `other`), `subject`, `status` (`open`, `in_progress`, `waiting_user`, `resolved`, `closed`), `priority` (`low`, `normal`, `high`, `urgent`), `assigned_to`, `resolved_at` | API (`R-SUP-01`) | quem abriu; equipa |
| `ticket_messages` | `ticket_id`, `author_id`, `body`, `attachment_path`, `is_internal_note bool`, `created_at` | API | quem abriu (sem notas internas, `R-SUP-03`); equipa |
| `contact_messages` | `name`, `email`, `phone`, `subject`, `body`, `status` (`new`, `handled`), `handled_by`, `ticket_id` | API, pública com limite (`R-SUP-02`) | equipa |

---

## 10. `notify`

| Tabela | Colunas | Nota |
|---|---|---|
| `notifications` | `account_id`, `kind` (código do catálogo, `specs/notifications.md`), `title`, `body`, `link`, `read_at`, `created_at` | escrita só por `notify.enqueue`; U coluna (`read_at`) — o próprio |
| `email_outbox` | `to_email`, `template`, `payload jsonb`, `status` (`queued`, `sending`, `sent`, `failed`), `attempts`, `next_attempt_at`, `last_error`, `sent_at` | escrita por `notify.enqueue`; consumida pelo worker da API (`R-NOT-03`) |

`notify.enqueue(kind, account, payload)` é **a única** que cria avisos e emails (`R-NOT-02`), chamada dentro da mesma transacção da mudança de estado.

`notify.enqueue_email(kind, email, payload)` é a variante para destinatários sem conta (convites de organização, formulário de contacto); é a única outra porta, e só escreve em `email_outbox`.

`notify.kinds` (`code text PK`, `channels text[]`): o catálogo de `specs/notifications.md`, carregado no seed; `notifications.kind` tem FK para ele, por isso um aviso fora do catálogo falha na base (`R-NOT-01`).

---

## 11. `audit`

`audit.events`: `id bigint identity`, `occurred_at`, `actor_account`, `actor_role` (nível de equipa, papel, ou `system`), `action`, `entity_type`, `entity_id`, `before jsonb`, `after jsonb`, `request_id` (da API), `ip`, `note`.

**Append-only para todos** (`D-62`, `R-AUD-01`): sem `UPDATE` nem `DELETE` concedidos, e o gatilho `util.forbid_mutation` recusa-os mesmo com `service_role`. Escrito por `audit.record` (`R-AUD-02`), chamado pelas funções de transição e pelo plugin de auditoria da API. **S** — `super_admin`; cada nível vê as entradas do seu âmbito (vista `audit.events_for_staff`).

---

## 12. `util` e tarefas agendadas

- `util.applied_migrations` (`name`, `sha256`, `applied_at`, `marked_only`).
- `util.set_updated_at()`, `util.forbid_mutation()`, `util.next_code(prefix)`, `util.app_timezone()`.
- `util.now()`: envolve `now()` e é **a única fonte de "agora" nas funções de regras**, para os testes poderem fixar o relógio (`claude-code-rules.md` §5). Nenhuma função de `booking`, `billing`, `verification` ou `community` chama `now()` directamente (verificação em `verify.py`).

**Tarefas `pg_cron`** (`packages/db/schedule/`, sempre a última fase):

| Tarefa | Frequência | Função | Regra |
|---|---|---|---|
| expirar convites | 5 min | `booking.expire_invites` | `R-DRC-02` |
| aviso de pedido incompleto | 15 min | `booking.warn_understaffed` | `R-REQ-10` |
| expirar pedidos sem intérpretes | 5 min | `booking.expire_unstaffed_requests` | `R-REQ-10` |
| confirmar entregas | 15 min | `booking.auto_confirm_deliveries` | `R-LIFE-04` |
| revelar avaliações | hora a hora | `booking.reveal_reviews` | `R-REV-02` |
| fechar fios de chat | hora a hora | `booking.close_threads` | `R-REQ-08` |
| expirar intenções de pagamento e avisar 12 horas antes | 5 min | `billing.expire_intents` | `R-PAY-06` |
| aviso urgente de pagamento por validar 2 horas antes do serviço | 15 min | `billing.warn_payment_review` | `D-94` |
| avisar mensagens por ler há mais de 10 minutos | 5 min | `booking.notify_unread_messages` | `R-NOT-02` (aviso `chat_message`) |
| aviso de selo a expirar | diária, 08:00 Luanda | `verification.notify_expiring_badges` | `R-VER-07` |
| expirar convites de organização | hora a hora | `identity.expire_org_invites` | `R-ORG-02` |
| fechar tickets resolvidos | diária | `support.autoclose_resolved` | `R-SUP-04` |
| fechar eventos passados | hora a hora | `community.complete_past_events` | `R-EVT-04` |
| fechar oportunidades com prazo passado | diária | `community.close_expired_opportunities` | `R-OPP-02` |

Cada tarefa é **idempotente**: correr duas vezes seguidas não muda nada à segunda.

---

## 13. Donos das regras que vivem em políticas ou em mais de uma função

Para que nenhuma regra fique sem dono. As outras estão indicadas nas secções acima.

| Regra | Dono |
|---|---|
| `R-ADM-01` (permissões do admin) | `auth_helper.is_staff` nas políticas; plugin `staff` da API nas rotas, ambos a partir da matriz de `R-STF-01` |
| `R-ADM-05` (supervisão de pedidos) | as funções de `booking` que a equipa chama, cada uma com a verificação de nível |
| `R-AUD-03` (auditoria por nível) | vista `audit.events_for_staff` |
| `R-DIR-04` (quem vê o perfil) | políticas de `identity.interpreter_profiles` e das tabelas de `directory`; vista `directory.public_listing` para anónimos |
| `R-DIR-05` (média) | vista `directory.interpreter_ratings` |
| `R-DIR-06` (cancelamentos tardios) | vista `directory.late_cancellations` |
| `R-FEED-01` (publicar no feed) | políticas de `community.feed_posts` |
| `R-FOR-01` (fórum só para intérpretes) | políticas de `community.forum_*` com `auth_helper.is_interpreter()` |
| `R-MAN-02` (orçamento inicial) | `booking.current_quote` |
| `R-MAN-07` (intérprete sai depois de pago) | `booking.cancel_assignment` e `identity.suspend_account`, com `billing.managed_refund_amount` em `booking.expire_unstaffed_requests` |
| `R-MAN-08` (repasse no gerido) | `billing.queue_payout`, chamada por `booking.confirm_delivery`, `booking.auto_confirm_deliveries` e `booking.resolve_dispute` |
| `R-NOT-01` (catálogo de avisos) | tabela `notify.kinds` com FK |
| `R-NOT-04` (avisos de serviço não se desligam) | `notify.enqueue` (não consulta preferências) |
| `R-NOT-05` (marcar como lida) | concessão de coluna `read_at` em `notify.notifications` |
| `R-OPN-05` (fim do aberto) | `booking.expire_unstaffed_requests` |
| `R-OPP-04` (quem vê oportunidades) | políticas de `community.opportunities` e `community.opportunity_applications` |
| `R-ORG-05` (quem vê e faz o quê numa organização) | `auth_helper.can_view_request`, `auth_helper.org_role` e as verificações de papel nas funções de `booking` e `billing` |
| `R-PRIV-04` (quem vê o quê) | as políticas deste documento; a tabela da spec é um resumo, não uma segunda definição |
