# API — Portal dos Intérpretes

> Todas as rotas de `apps/api` (Fastify). A API é a porta do que é sensível (`architecture.md` §1): autentica, valida a forma do pedido, chama a função SQL dona da regra, regista na auditoria e traduz erros. **Não reimplementa regras.** Cada rota cita a regra que exerce; a regra está escrita na spec.
>
> As leituras normais **não** passam pela API: vão directas ao Supabase com RLS, pela camada de dados (`packages/data`). Estão no fim (§16) só para se saber onde vivem.

---

## 1. Convenções

- **Base:** `API_URL`. JSON em `snake_case`. Datas em ISO 8601 com fuso.
- **Autenticação:** `Authorization: Bearer <JWT do Supabase>`. O plugin `auth` resolve a conta a partir do JWT. **Nenhuma rota aceita um id de conta no corpo para agir em nome de alguém.**
- **Quem pode chamar** (coluna "Quem"):
  - `público` — sem sessão; com limite por IP;
  - `conta` — qualquer conta activa, com os termos em vigor aceites;
  - `solicitante`, `intérprete` — conta com esse papel;
  - `org:owner|admin` — papel na organização em causa;
  - `participante` — parte do pedido ou do fio;
  - níveis de equipa: `super`, `mod` (`moderator`), `fin` (`finance`), `op` (`request_operator`). `super` passa sempre.
- **Resposta de sucesso:** `200` (ou `201` na criação) com o recurso afectado.
- **Paginação nas listas da API:** `limit` (≤ 100), `offset`, `q`, `sort`, `state`. `state` ausente quer dizer a fila de trabalho; `state=all` quer dizer o histórico (`R-ADM-06`).
- **Idempotência:** as rotas que criam pagamentos, comprovativos e reembolsos aceitam o cabeçalho `Idempotency-Key`; um segundo pedido com a mesma chave devolve a mesma resposta sem escrever outra vez.
- **Limites de pedidos:** `POST /auth/register` e `POST /contact`, 5 por hora por IP; rotas de criação, 60 por minuto por conta; o resto, 300 por minuto por conta.

---

## 2. Erros — catálogo único

**Formato:**

```json
{ "error": { "code": "SCHEDULE_OVERLAP", "message": "Já tens um serviço aceite neste horário.", "field": null } }
```

- `code`: estável, em inglês. **A app decide sempre pelo `code`**, nunca pela mensagem.
- `message`: em português, pronta a mostrar. Nos erros técnicos, uma frase genérica; o texto real vai para o log.
- `field`: o campo do formulário a que o erro pertence, ou `null`. **O campo é decidido por este catálogo**, nunca escrito à mão numa rota. A tradução de um erro da base para o código vive num sítio só: `apps/api/src/lib/dbErrors.ts`, pelo nome da restrição ou pelo código lançado pela função SQL.
- Nunca chega ao ecrã texto técnico da base nem o nome de uma restrição.

### Gerais

| Código | HTTP | Mensagem | Campo |
|---|---|---|---|
| `UNAUTHENTICATED` | 401 | A tua sessão terminou. Entra outra vez. | — |
| `ACCOUNT_SUSPENDED` | 403 | A tua conta está suspensa. Contacta o suporte. | — |
| `TERMS_ACCEPTANCE_REQUIRED` | 403 | Há uma nova versão dos termos. Aceita-a para continuar. | — |
| `FORBIDDEN` | 403 | Não tens permissão para fazer isto. | — |
| `NOT_FOUND` | 404 | Não encontrámos o que procuras. | — |
| `VALIDATION_FAILED` | 400 | Há campos por corrigir. | por campo, em `details` |
| `STATE_CHANGED` | 409 | Isto mudou entretanto. Actualiza a página e tenta outra vez. | — |
| `CONFIG_VALUE_MISSING` | 409 | Esta operação ainda não está disponível: falta um valor de configuração da plataforma. | — |
| `IN_USE` | 409 | Este item já foi usado. Desactiva-o em vez de o apagar. | — |
| `EXPORT_TOO_LARGE` | 422 | A exportação tem demasiadas linhas. Escolhe um período mais curto. | `to` |
| `RATE_LIMITED` | 429 | Demasiadas tentativas. Espera um pouco e tenta outra vez. | — |
| `INTERNAL_ERROR` | 500 | Algo correu mal do nosso lado. Tenta outra vez dentro de momentos. | — |

### Contas e organizações

| Código | HTTP | Mensagem | Campo |
|---|---|---|---|
| `EMAIL_IN_USE` | 409 | Já existe uma conta com este email. | `email` |
| `WEAK_PASSWORD` | 400 | A palavra-passe tem de ter pelo menos 8 caracteres, com letras e números. | `password` |
| `TERMS_NOT_ACCEPTED` | 400 | Tens de aceitar os termos e a política de privacidade. | `accept_terms` |
| `INVALID_PHONE` | 400 | Número de telefone inválido. Usa o formato 923 000 000. | `phone` |
| `INVALID_NIF` | 400 | NIF inválido. | `nif` |
| `NIF_IN_USE` | 409 | Já existe uma organização com este NIF. | `nif` |
| `INVALID_IBAN` | 400 | IBAN inválido. Um IBAN angolano começa por AO06 e tem 25 caracteres. | `iban` |
| `ROLE_ALREADY_EXISTS` | 409 | Já tens este papel na tua conta. | — |
| `INVITE_INVALID` | 410 | Este convite já não é válido. Pede um novo a quem te convidou. | — |
| `INVITE_EMAIL_MISMATCH` | 403 | Este convite foi enviado para outro email. Entra com esse email para o aceitar. | — |
| `ACCOUNT_NOT_FOUND` | 404 | Não há nenhuma conta com este email. A pessoa tem de se registar primeiro. | `email` |
| `LAST_OWNER` | 409 | A organização precisa de um dono. Transfere a posse antes de sair. | — |
| `LAST_SUPER_ADMIN` | 409 | Tem de existir pelo menos um super-administrador activo. | — |
| `DELETION_BLOCKED_ACTIVE_REQUEST` | 409 | Não podes apagar a conta enquanto tiveres pedidos em curso. | — |
| `DELETION_BLOCKED_PAYMENT` | 409 | Não podes apagar a conta enquanto houver um pagamento por resolver. | — |

### Pedidos, negociação e ciclo do serviço

| Código | HTTP | Mensagem | Campo |
|---|---|---|---|
| `PRICE_CHANGED` | 409 | O total mudou desde a revisão. Confirma o novo valor antes de enviar. | — |
| `START_TOO_SOON` | 400 | O serviço tem de começar pelo menos {min} minutos a partir de agora. | `starts_at` |
| `DURATION_OUT_OF_RANGE` | 400 | A duração tem de estar entre 15 minutos e 12 horas. | `duration_minutes` |
| `TOO_MANY_INTERPRETERS` | 400 | Um pedido pode ter no máximo {max} intérpretes. | `interpreters_needed` |
| `MEETING_LINK_REQUIRED` | 400 | Indica o link da reunião. | `meeting_link` |
| `INVALID_MEETING_LINK` | 400 | O link tem de começar por https://. | `meeting_link` |
| `ADDRESS_REQUIRED` | 400 | Indica a morada do serviço. | `address` |
| `LANGUAGE_REQUIRED` | 400 | Escolhe pelo menos uma língua. | `language_ids` |
| `BUDGET_REQUIRED` | 400 | Indica o valor que pagas a cada intérprete. | `budget_per_interpreter_aoa` |
| `SERVICE_INACTIVE` | 409 | Este serviço já não está disponível. | `service_id` |
| `INTERPRETER_NOT_ELIGIBLE` | 409 | Este intérprete não pode receber este pedido: {reason}. | `interpreter_id` |
| `SLOTS_FULL` | 409 | Este pedido já tem todos os intérpretes de que precisa. | — |
| `SCHEDULE_OVERLAP` | 409 | Já tens um serviço aceite neste horário. | — |
| `INVITE_EXPIRED` | 410 | Este convite expirou. | — |
| `REQUEST_LOCKED` | 409 | Já há intérpretes aceites: a data, a hora, a duração e o local não podem mudar. Cancela e cria um novo pedido. | — |
| `CANNOT_REDUCE_BELOW_ACCEPTED` | 409 | Já tens {accepted} intérpretes aceites; não podes pedir menos. | `interpreters_needed` |
| `NOT_FINISHED_YET` | 409 | Só podes marcar como feito depois da hora de fim do serviço. | — |
| `CONFIRMATION_WINDOW_CLOSED` | 409 | O prazo para confirmar ou abrir disputa terminou. | — |
| `NEGOTIATION_CLOSED` | 409 | A negociação deste pedido já está fechada. | — |
| `NEGOTIATION_DISABLED` | 409 | Este intérprete não aceita negociar o preço. | — |
| `PROPOSAL_NOT_OPEN` | 409 | Esta proposta já foi respondida. | — |
| `OWN_PROPOSAL` | 409 | Não podes responder à tua própria proposta. | — |
| `INVALID_AMOUNT` | 400 | Indica um valor maior que zero, em kwanzas. | `amount_aoa` |
| `ORG_APPROVAL_PENDING` | 409 | Este pedido aguarda aprovação de um responsável da organização. | — |
| `REVIEW_NOT_ALLOWED` | 409 | Só podes avaliar depois de o serviço estar concluído. | — |
| `REVIEW_WINDOW_CLOSED` | 409 | O prazo para avaliar este serviço terminou. | — |
| `REVIEW_EXISTS` | 409 | Já avaliaste este serviço. | — |
| `DISPUTE_OPEN` | 409 | Já existe uma disputa aberta neste serviço. | — |

### Pagamentos

| Código | HTTP | Mensagem | Campo |
|---|---|---|---|
| `PAYMENT_ALREADY_PENDING` | 409 | Já existe um pagamento em curso para isto. | — |
| `PROOF_ALREADY_PENDING` | 409 | Já enviaste um comprovativo que está a ser analisado. | — |
| `PROOF_FILE_INVALID` | 400 | O comprovativo tem de ser PDF, JPG ou PNG, até 10 MB. | `file` |
| `INTENT_EXPIRED` | 410 | O prazo para pagar terminou. | — |
| `REFUND_EXCEEDS_TOTAL` | 409 | O reembolso ultrapassa o que foi pago. | `amount_aoa` |
| `PAYOUT_DETAILS_MISSING` | 409 | O intérprete ainda não indicou o IBAN para receber. | — |

### Verificação, comunidade e suporte

| Código | HTTP | Mensagem | Campo |
|---|---|---|---|
| `VERIFICATION_OPEN_EXISTS` | 409 | Já tens um pedido de verificação em curso. | — |
| `REQUIRED_DOCUMENTS_MISSING` | 400 | Faltam documentos obrigatórios: {list}. | `documents` |
| `RESUBMISSIONS_EXHAUSTED` | 409 | Já usaste as correcções gratuitas. Para continuar, inicia um novo pedido de verificação. | — |
| `BADGE_REQUIRED` | 403 | Só intérpretes verificados podem fazer isto. | — |
| `FILE_INVALID` | 400 | Ficheiro inválido: {reason}. | `file` |
| `EVENT_FULL` | 409 | Este evento já não tem lugares. | — |
| `ALREADY_REGISTERED` | 409 | Já estás inscrito neste evento. | — |
| `ALREADY_APPLIED` | 409 | Já te candidataste a esta oportunidade. | — |
| `TOPIC_LOCKED` | 409 | Este tópico está fechado a novas respostas. | — |
| `MENTOR_FULL` | 409 | Este mentor não tem vagas neste momento. | — |
| `MENTORSHIP_EXISTS` | 409 | Já tens uma mentoria activa ou pedida com este mentor. | — |

---

## 3. Sistema

| Rota | Quem | Saída |
|---|---|---|
| `GET /health` | público | `{ status, version, commit, migration_in_build, migration_in_database }` |

## 4. Sessão e contas — `specs/accounts-and-organizations.md`, `specs/personal-data.md`

| Rota | Quem | Entrada | Saída | Erros | Regra |
|---|---|---|---|---|---|
| `POST /auth/register` | público | `email`, `password`, `full_name`, `intended_role` (`requester`, `interpreter`, `organization`), `accept_terms: true`, `legal_document_ids` | `{ account_id, email_confirmation_sent: true }` | `EMAIL_IN_USE`, `WEAK_PASSWORD`, `TERMS_NOT_ACCEPTED`, `RATE_LIMITED` | `R-ACC-01`, `R-PRIV-01` |
| `GET /me` | sessão (mesmo sem termos) | — | `{ account, roles, staff_level, organizations, last_active_role, terms_acceptance_required, pending_documents }` | `ACCOUNT_SUSPENDED` | `R-ACC-02`, `R-ACC-03`, `R-PRIV-02` |
| `POST /me/accept-terms` | sessão | `legal_document_ids` | `{ ok }` | `VALIDATION_FAILED` | `R-PRIV-02` |
| `POST /me/active-role` | conta | `role` | `{ last_active_role, app_url }` | `FORBIDDEN` | `R-ACC-04` |
| `POST /onboarding/requester` | conta | `nif?`, `address?`, `city?` | perfil | `ROLE_ALREADY_EXISTS`, `INVALID_NIF` | `R-ACC-01` |
| `POST /onboarding/interpreter` | conta | `bio?`, `city?` | perfil com `slug` | `ROLE_ALREADY_EXISTS` | `R-ACC-01`, `R-DIR-02` |
| `POST /me/deletion-request` | conta | `confirm: true`, `password` | `{ status }` | `DELETION_BLOCKED_ACTIVE_REQUEST`, `DELETION_BLOCKED_PAYMENT` | `R-PRIV-03` |
| `PUT /me/payout-details` | intérprete | `account_holder`, `bank_name`, `iban` | detalhes | `INVALID_IBAN` | `R-PAY-11` |

## 5. Organizações — `specs/accounts-and-organizations.md`

| Rota | Quem | Entrada | Saída | Erros | Regra |
|---|---|---|---|---|---|
| `POST /organizations` | conta | `name`, `nif`, `sector?`, `address?`, `city?`, `phone?`, `website_url?` | organização | `NIF_IN_USE`, `INVALID_NIF`, `INVALID_PHONE` | `R-ORG-01` |
| `POST /organizations/:id/invites` | org:owner/admin | `email`, `role` | convite | `VALIDATION_FAILED` | `R-ORG-02` |
| `POST /organizations/:id/invites/:inviteId/revoke` | org:owner/admin | — | convite | `STATE_CHANGED` | `R-ORG-02` |
| `POST /invites/accept` | conta | `token` | membro | `INVITE_INVALID`, `INVITE_EMAIL_MISMATCH` | `R-ORG-02` |
| `PATCH /organizations/:id/members/:accountId` | org:owner | `role` (`admin`, `member`) | membro | `LAST_OWNER` | `R-ORG-03` |
| `POST /organizations/:id/members/:accountId/remove` | org:owner/admin; ou o próprio | — | membro | `LAST_OWNER` | `R-ORG-04` |
| `POST /organizations/:id/transfer-ownership` | org:owner | `new_owner_account_id` (tem de ser membro) | organização | `FORBIDDEN` | `R-ORG-03` |

## 6. Ficheiros privados

| Rota | Quem | Entrada | Saída | Erros | Regra |
|---|---|---|---|---|---|
| `POST /uploads/sign` | conta | `purpose` (`payment_proof`, `verification_document`, `chat_attachment`, `ticket_attachment`), `subject_id`, `file_name`, `content_type`, `size_bytes` | `{ path, signed_upload_url, expires_at }` | `FILE_INVALID`, `FORBIDDEN` | quem pode carregar para o `subject_id` é decidido pela mesma função que decide quem o vê |
| `GET /files/url` | conta | `path` | `{ signed_url, expires_at }` (5 minutos) | `FORBIDDEN` | as leituras pela equipa de documentos de verificação e anexos de chat ficam na auditoria (`R-VER-09`, `R-PRIV-05`) |

Tipos e tamanhos por finalidade: comprovativos e documentos PDF/JPG/PNG até 10 MB; anexos de chat e de tickets PDF/JPG/PNG até 5 MB.

## 7. Pedidos — `specs/requests-core.md`, `requests-direct.md`, `requests-open.md`, `requests-managed.md`

| Rota | Quem | Entrada | Saída | Erros | Regra |
|---|---|---|---|---|---|
| `POST /requests` | solicitante (ou membro de org) | `kind`, `open_mode?`, `organization_id?`, `service_id`, `language_ids[]`, `modality`, `starts_at`, `duration_minutes`, `interpreters_needed`, `meeting_link?`, `address?`, `city?`, `notes?`, `beneficiary_name?`, `beneficiary_contact?`, `budget_per_interpreter_aoa?`, `interpreter_ids?` (directo: convites iniciais), `expected_total_aoa` (o total mostrado na revisão) | pedido com `code`, `status`, totais | `PRICE_CHANGED`, `CONFIG_VALUE_MISSING`, `START_TOO_SOON`, `DURATION_OUT_OF_RANGE`, `TOO_MANY_INTERPRETERS`, `MEETING_LINK_REQUIRED`, `INVALID_MEETING_LINK`, `ADDRESS_REQUIRED`, `LANGUAGE_REQUIRED`, `BUDGET_REQUIRED`, `SERVICE_INACTIVE`, `INTERPRETER_NOT_ELIGIBLE`, `FORBIDDEN` | `R-REQ-01`, `R-REQ-03`, `R-DRC-01`, `R-MAN-01` |
| `POST /requests/:id/invites` | criador ou org:owner/admin | `interpreter_id` | atribuição `invited` | `INTERPRETER_NOT_ELIGIBLE`, `SLOTS_FULL` | `R-DRC-01`, `R-DRC-05` |
| `POST /requests/:id/reduce` | criador ou org:owner/admin | `interpreters_needed` | pedido | `CANNOT_REDUCE_BELOW_ACCEPTED` | `R-REQ-09` |
| `PATCH /requests/:id/meeting-link` | criador antes da primeira aceitação; intérprete aceite até ao início | `meeting_link` | pedido | `INVALID_MEETING_LINK`, `REQUEST_LOCKED` | `R-REQ-06` |
| `POST /requests/:id/cancel` | criador, org:owner/admin, `mod`, `op` | `reason` | pedido | `STATE_CHANGED` | `R-LIFE-01` |
| `POST /requests/:id/approve` | org:owner/admin | — | pedido `quoting` | `STATE_CHANGED` | `R-MAN-01` |
| `POST /requests/:id/reject` | org:owner/admin | `reason` | pedido `cancelled` | `STATE_CHANGED` | `R-MAN-01` |
| `POST /requests/:id/accept-quote` | criador ou org:owner/admin | — | pedido `awaiting_interpreters` | `NEGOTIATION_CLOSED`, `ORG_APPROVAL_PENDING` | `R-MAN-03` |
| `POST /requests/:id/accept` | intérprete | — | atribuição `accepted` | `INTERPRETER_NOT_ELIGIBLE`, `SLOTS_FULL`, `SCHEDULE_OVERLAP` | `R-OPN-02` |
| `POST /requests/:id/applications` | intérprete | `message?` | atribuição `applied` com `offered_price_aoa` | `INTERPRETER_NOT_ELIGIBLE`, `SLOTS_FULL` | `R-OPN-03` |
| `POST /requests/:id/select` | criador ou org:owner/admin | `assignment_id` | atribuição `accepted` | `SLOTS_FULL`, `SCHEDULE_OVERLAP`, `STATE_CHANGED` | `R-OPN-04` |

### Atribuições

| Rota | Quem | Entrada | Saída | Erros | Regra |
|---|---|---|---|---|---|
| `POST /assignments/:id/accept` | o intérprete da linha | — | atribuição `accepted` | `INVITE_EXPIRED`, `SCHEDULE_OVERLAP`, `SLOTS_FULL`, `CONFIG_VALUE_MISSING` | `R-DRC-03`, `R-REQ-05`, `R-PAY-13` |
| `POST /assignments/:id/decline` | o intérprete da linha | `reason` | atribuição `declined` | `STATE_CHANGED` | `R-DRC-04` |
| `POST /assignments/:id/withdraw` | o intérprete da linha | — | atribuição `withdrawn` | `STATE_CHANGED` | `R-OPN-03` |
| `POST /assignments/:id/cancel` | o intérprete da linha; `mod`, `op` | `reason` | atribuição `cancelled` | `STATE_CHANGED` | `R-LIFE-02` |
| `POST /assignments/:id/deliver` | o intérprete da linha | — | atribuição `delivered` | `NOT_FINISHED_YET` | `R-LIFE-03` |
| `POST /assignments/:id/confirm` | criador ou org:owner/admin | — | atribuição `completed` | `CONFIRMATION_WINDOW_CLOSED` | `R-LIFE-04` |
| `POST /assignments/:id/disputes` | as duas partes | `reason` | disputa | `DISPUTE_OPEN`, `CONFIRMATION_WINDOW_CLOSED` | `R-LIFE-05` |
| `POST /assignments/:id/reviews` | as duas partes | `rating`, `comment?` | avaliação | `REVIEW_NOT_ALLOWED`, `REVIEW_WINDOW_CLOSED`, `REVIEW_EXISTS` | `R-REV-01` |

## 8. Negociação — `specs/negotiation.md`

| Rota | Quem | Entrada | Saída | Erros | Regra |
|---|---|---|---|---|---|
| `POST /threads/:id/proposals` | participante; `op`/`mod` no fio do gerido | `amount_aoa` | proposta `open` (a anterior fica `void`) | `NEGOTIATION_CLOSED`, `NEGOTIATION_DISABLED`, `INVALID_AMOUNT` | `R-NEG-01` a `R-NEG-04` |
| `POST /proposals/:id/accept` | a outra parte | — | proposta `accepted`, preço proposto actualizado | `PROPOSAL_NOT_OPEN`, `OWN_PROPOSAL`, `NEGOTIATION_CLOSED` | `R-NEG-03` |
| `POST /proposals/:id/reject` | a outra parte | — | proposta `rejected` | `PROPOSAL_NOT_OPEN`, `OWN_PROPOSAL` | `R-NEG-02` |

As **mensagens** do chat escrevem-se directamente na base, com RLS (`data-model.md` §5). Os anexos usam `POST /uploads/sign`.

## 9. Pagamentos — `specs/payments.md`

| Rota | Quem | Entrada | Saída | Erros | Regra |
|---|---|---|---|---|---|
| `POST /payment-intents/:id/proofs` | o pagador (ou org:owner/admin) | `file_path` (de `/uploads/sign`) | comprovativo `pending`; intenção `proof_submitted` | `PROOF_ALREADY_PENDING`, `INTENT_EXPIRED`, `PROOF_FILE_INVALID` | `R-PAY-04` |
| `GET /receipts/:id/pdf` | quem vê a intenção | — | PDF | `NOT_FOUND` | `R-PAY-12` |
| `POST /admin/proofs/:id/accept` | `fin` | — | intenção `confirmed`, recibo emitido | `STATE_CHANGED` | `R-PAY-05`, `R-PAY-12` |
| `POST /admin/proofs/:id/reject` | `fin` | `reason` | comprovativo `rejected`, intenção `awaiting_proof` | `STATE_CHANGED` | `R-PAY-05` |
| `POST /admin/refunds` | `fin` | `intent_id`, `amount_aoa`, `reason_code: manual`, `note` | reembolso `pending` | `REFUND_EXCEEDS_TOTAL` | `R-PAY-07` |
| `POST /admin/refunds/:id/mark-paid` | `fin` | `reference` | reembolso `paid`, recibo de reembolso | `STATE_CHANGED` | `R-PAY-07`, `R-PAY-12` |
| `POST /admin/payouts/:id/mark-paid` | `fin` | `reference` | repasse `paid` | `PAYOUT_DETAILS_MISSING`, `STATE_CHANGED` | `R-PAY-10`, `R-PAY-11` |

As intenções **não se criam por rota**: nascem de `booking.on_payment_event`, `verification.submit` e `community.register_for_event`, dentro da transacção que as justifica (`R-PAY-01`).

## 10. Verificação — `specs/verification.md`

| Rota | Quem | Entrada | Saída | Erros | Regra |
|---|---|---|---|---|---|
| `POST /verification-requests` | intérprete | — | pedido `draft` (`kind` decidido pela função) | `VERIFICATION_OPEN_EXISTS` | `R-VER-01` |
| `POST /verification-requests/:id/documents` | o próprio | `document_type_id`, `file_path`, `original_name` | documento | `FILE_INVALID`, `STATE_CHANGED` | `R-VER-02` |
| `POST /verification-documents/:id/remove` | o próprio, só em `draft` ou `needs_changes` | — | — | `STATE_CHANGED` | `R-VER-02` |
| `POST /verification-requests/:id/submit` | o próprio | — | pedido `awaiting_payment` + intenção | `REQUIRED_DOCUMENTS_MISSING`, `CONFIG_VALUE_MISSING` | `R-VER-02`, `R-VER-03` |
| `POST /verification-requests/:id/resubmit` | o próprio | — | pedido `under_review` | `REQUIRED_DOCUMENTS_MISSING`, `RESUBMISSIONS_EXHAUSTED` | `R-VER-05` |
| `POST /verification-requests/:id/cancel` | o próprio em `draft`, `awaiting_payment`, `needs_changes`; `mod` também em `under_review` | `reason` (obrigatório para `mod`) | pedido `cancelled` | `STATE_CHANGED` | `R-VER-01` |
| `POST /admin/verification-requests/:id/decide` | `mod` | `decision` (`approve`, `reject`, `needs_changes`), `notes`, `documents: [{ id, review_status, review_notes }]` | pedido decidido; selo se aprovado | `STATE_CHANGED`, `VALIDATION_FAILED` | `R-VER-04`, `R-VER-06`, `R-PAY-08` |
| `POST /admin/badges/:id/revoke` | `mod` | `reason` | selo revogado | `STATE_CHANGED` | `R-VER-08` |

## 11. Equipa, configuração e catálogos — `specs/staff-and-config.md`, `specs/catalogs.md`

| Rota | Quem | Entrada | Saída | Regra |
|---|---|---|---|---|
| `POST /admin/staff` | `super` | `email` (conta existente), `level` | membro da equipa (`ACCOUNT_NOT_FOUND`) | `R-STF-01` |
| `PATCH /admin/staff/:accountId` | `super` | `level?`, `active?` | membro (`LAST_SUPER_ADMIN`) | `R-STF-02` |
| `POST /admin/config/versions` | `super` | `from_version_id?` | rascunho (cópia da versão indicada ou da publicada) | `R-CFG-02` |
| `PATCH /admin/config/versions/:id` | `super` | campos da versão (só rascunhos) | rascunho (`STATE_CHANGED` se não for rascunho) | `R-CFG-02` |
| `POST /admin/config/versions/:id/publish` | `super` | `expected_current_version_id` (a versão em vigor que o ecrã mostrou; se já não for, `STATE_CHANGED`) | versão publicada; a anterior fica `retired` | `R-CFG-01`, `R-CFG-02` |
| `POST /admin/legal-documents` | `super` | `kind`, `body` | rascunho | `R-PRIV-01` |
| `PATCH /admin/legal-documents/:id` | `super` | `body` (só rascunhos) | rascunho | `R-PRIV-01` |
| `POST /admin/legal-documents/:id/publish` | `super` | — | publicado; contas passam a precisar de aceitar | `R-PRIV-02` |
| `POST`/`PATCH /admin/document-types(/:id)` | `mod` | `code`, `name`, `description`, `required`, `active`, `sort` | tipo | `R-VER-02` |
| `POST`/`PATCH /admin/catalog/languages(/:id)` | `mod` | `code`, `name`, `is_sign_language`, `active`, `sort` | língua | `R-CAT-01` |
| `POST`/`PATCH /admin/catalog/specialties(/:id)` | `mod` | `slug`, `name`, `description`, `active`, `sort` | especialidade | `R-CAT-01` |
| `POST`/`PATCH /admin/catalog/services(/:id)` | `mod` | `slug`, `title`, `description`, `pricing_mode`, `platform_price_aoa`, `icon`, `active`, `sort` | serviço | `R-CAT-01`, `R-CAT-02` |
| `DELETE /admin/catalog/{languages,specialties,services}/:id`, `DELETE /admin/document-types/:id` | `mod` | — | `204`; usado → `IN_USE` | `R-CAT-01` |

## 12. Operações da equipa — `specs/admin-operations.md`, `specs/service-lifecycle.md`, `specs/requests-managed.md`

| Rota | Quem | Entrada | Saída | Regra |
|---|---|---|---|---|
| `POST /admin/accounts/:id/suspend` | `mod` | `reason` | conta suspensa + cascata | `R-ACC-05` |
| `POST /admin/accounts/:id/reactivate` | `mod` | — | conta activa | `R-ACC-06` |
| `POST /admin/organizations/:id/suspend` | `mod` | `reason` | organização suspensa + cascata | `R-ACC-05` |
| `POST /admin/organizations/:id/reactivate` | `mod` | — | organização activa | `R-ACC-06` |
| `POST /admin/requests/:id/assign` | `op`, `mod` | `interpreter_id` | atribuição `invited` (`team_assigned`) | `R-MAN-04` |
| `GET /admin/threads/:id/messages` | `mod`, `op`, `super` | `limit`, `before?` | mensagens; **cada chamada fica na auditoria** | `R-PRIV-05` |
| `POST /admin/disputes/:id/resolve` | `mod` | `resolution`, `refund_decision?`, `notes` | disputa resolvida | `R-LIFE-06` |
| `POST /admin/reviews/:id/hide` | `mod` | `reason` | avaliação escondida | `R-REV-04` |
| `POST /admin/content/:type/:id/remove` | `mod` | `reason` | conteúdo `removed`; autor avisado | `R-DIR-07`, `R-COM-02` |
| `POST /admin/content-reports/:id/resolve` | `mod` | `action` (`dismiss`, `remove`), `reason` | denúncia tratada | `R-COM-01` |
| `GET /admin/reports/:name` | pela matriz de `R-STF-01`: `overview` toda a equipa; `requests` `mod`, `op` (só geridos); `payments` `fin`; `verifications` `mod` (`super` sempre) | `from`, `to` | séries do período e do período anterior do mesmo tamanho; vazio, nunca zeros inventados | `R-ADM-02` |
| `GET /admin/exports/:dataset.csv` | `super`, `fin` | `from`, `to`, filtros | CSV; fica na auditoria (`EXPORT_TOO_LARGE`) | `R-ADM-03` |
| `GET /admin/emails` | `super` | `status` (por omissão `failed`), paginação | emails da fila | `R-NOT-03` |
| `POST /admin/emails/:id/retry` | `super` | — | email volta a `pending`, tentativas a zero | `R-NOT-03` |
| `POST`/`PATCH`/`POST …/publish` em `/admin/content/{testimonials,success-cases,tutorials,lga-videos}` | `mod` | campos de `data-model.md` §8 | conteúdo | `R-ADM-04` |

## 13. Comunidade — `specs/community-*.md`

| Rota | Quem | Entrada | Regra |
|---|---|---|---|
| `POST /opportunities` | `mod`; org:owner/admin | campos de `opportunities` + `language_ids` | `R-OPP-01` |
| `PATCH /opportunities/:id` | quem publicou (em `draft`/`open`); `mod` | campos | `R-OPP-02` |
| `POST /opportunities/:id/status` | quem publicou; `mod` | `status` | `R-OPP-02` |
| `POST /opportunities/:id/applications` | intérprete | `message` | `R-OPP-03` (`ALREADY_APPLIED`) |
| `POST /opportunity-applications/:id/withdraw` | o candidato | — | `R-OPP-03` |
| `POST /opportunity-applications/:id/status` | quem publicou | `status` | `R-OPP-03` |
| `POST`/`PATCH /admin/events(/:id)`, `POST /admin/events/:id/publish`, `POST /admin/events/:id/cancel` | `mod` | campos de `events` | `R-EVT-01`, `R-EVT-05` |
| `POST /events/:id/registrations` | conta (conforme `audience`) | — | `R-EVT-02` (`EVENT_FULL`, `ALREADY_REGISTERED`) |
| `POST /event-registrations/:id/cancel` | o próprio | — | `R-EVT-03` |
| `POST /admin/events/:id/attendance` | `mod` | `[{ registration_id, status }]` | `R-EVT-04` |
| `POST`/`PATCH /admin/courses(/:id)` | `mod` | campos de `courses` | `R-CRS-01` |
| `PUT /mentor-profile` | intérprete com selo | `areas`, `bio`, `active` | `R-MEN-01` (`BADGE_REQUIRED`) |
| `POST /mentorships` | intérprete | `mentor_id`, `message` | `R-MEN-02` (`MENTOR_FULL`, `MENTORSHIP_EXISTS`) |
| `POST /admin/mentorships/:id/decide` | `mod` | `decision` (`approve`, `reject`), `notes` | `R-MEN-02` |
| `POST /mentorships/:id/end` | as duas partes; `mod` | `reason` | `R-MEN-03` |
| `POST`/`PATCH /admin/library(/:id)` | `mod` | campos de `library_resources` | `R-LIB-01` |
| `POST /forum/topics/:id/solution` | o autor do tópico | `post_id` | `R-FOR-04` |
| `POST /admin/forum/topics/:id/pin`, `…/lock` | `mod` | `value: bool` | `R-FOR-02` |
| `POST`/`PATCH /admin/partners(/:id)`, `/admin/benefits(/:id)` | `mod` | campos | `R-BEN-02` |
| `POST /testimonials` | conta | `content`, `rating`, `author_role?` | `R-ADM-04` (entra `pending`) |

## 14. Suporte — `specs/support.md`

| Rota | Quem | Entrada | Regra |
|---|---|---|---|
| `POST /contact` | público | `name`, `email`, `phone?`, `subject`, `body`, `website` (campo-armadilha, tem de vir vazio) | `R-SUP-02` |
| `POST /support/tickets` | conta | `category`, `subject`, `body` (anexos só nas mensagens seguintes, porque o caminho do ficheiro precisa do id do ticket) | `R-SUP-01` |
| `POST /support/tickets/:id/messages` | quem abriu | `body`, `attachment_path?` | `R-SUP-01` |
| `POST /support/tickets/:id/close` | quem abriu | — | `R-SUP-01` |
| `PATCH /admin/support/tickets/:id` | equipa | `status?`, `priority?`, `assigned_to?` | `R-SUP-01` |
| `POST /admin/support/tickets/:id/messages` | equipa | `body`, `is_internal_note` | `R-SUP-01`, `R-SUP-03` |
| `POST /admin/contact-messages/:id/handle` | equipa | `create_ticket: bool` | `R-SUP-02` |

## 15. Trabalho de fundo da API

- **Worker do email** (`jobs/emailOutbox.ts`): a cada 30 segundos, reserva até 20 linhas `queued` com `next_attempt_at <= now()` (`FOR UPDATE SKIP LOCKED`), envia pelo adaptador, marca `sent` ou volta a `queued` com espera de 1, 5 e 30 minutos; à quarta falha, `failed` (`R-NOT-03`). Em desenvolvimento, o adaptador envia para o servidor de email local do Supabase.

## 16. Leituras directas (sem API)

Por RLS, pela camada de dados: perfis, directório, catálogos, configuração publicada, pedidos e atribuições (`booking.request_details`, `booking.open_requests_for_me`), fios e mensagens, propostas, avaliações, intenções, comprovativos, recibos, repasses, verificação, comunidade, tickets, notificações, auditoria (equipa).

Funções `STABLE` chamadas por RPC, com `EXECUTE` para `authenticated`: `catalog.quote_service` (`R-REQ-02`), `booking.preview_request_total` (`R-REQ-02`), `directory.is_eligible_for` (`R-DIR-09`), `directory.is_profile_complete` (`R-DIR-01`).

Escritas directas (concessão de coluna + RLS): perfil próprio, papel de intérprete (texto), línguas, especialidades, serviços e preços próprios, disponibilidade, formação, experiência, certificações, vídeos e artigos (sem estado), favoritos, mensagens do chat, leitura de mensagens, notificações lidas, denúncias, tópicos e respostas do fórum, publicações, comentários e gostos do feed.
