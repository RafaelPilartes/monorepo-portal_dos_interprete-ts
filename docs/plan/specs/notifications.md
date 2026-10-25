# Spec — Notificações

> Transversal: cada passo que cria um acontecimento acrescenta aqui o seu aviso, e só aqui. Decisão: `D-50`.

---

## Regras

**R-NOT-01 — o catálogo é este ficheiro.** Cada aviso tem um código, destinatários, canais e texto. Os textos ficam em `packages/i18n` (portal) e nos modelos de email da API, mas a **lista** de avisos e de quem os recebe é a tabela abaixo. Um aviso que não esteja aqui não existe.

**R-NOT-02 — um sítio cria avisos.** `notify.enqueue(kind, account, payload)`, chamada **dentro da transacção** da mudança que justifica o aviso: se a mudança falhar, o aviso não sai. Cria a linha em `notify.notifications` e, se o canal incluir email, a linha em `notify.email_outbox`. Para quem ainda não tem conta (o convite de organização, a resposta ao formulário de contacto), `notify.enqueue_email(kind, email, payload)` cria só a linha em `notify.email_outbox`. Nenhuma outra função escreve nestas tabelas. Todos os códigos existem em `notify.kinds` (FK), gerado deste catálogo.

**R-NOT-03 — entrega de email.** O worker da API envia, com até 3 novas tentativas (1, 5 e 30 minutos), e marca `failed` à quarta falha. Um email falhado não desfaz nada; aparece em `admin-web` em "Emails por entregar", com "Reenviar".

**R-NOT-04 — os avisos de serviço não se desligam.** Os avisos desta tabela são de serviço (sobre pedidos, pagamentos, conta). Não há preferências para os desligar nesta corrida. As definições mostram a lista do que se recebe.

**R-NOT-05 — lidas.** O próprio marca uma ou todas como lidas (coluna `read_at`). O contador do cabeçalho é a contagem das não lidas.

## Catálogo

Canais: **P** portal, **E** email. Destinatário "solicitante" quer dizer o criador do pedido e, numa organização, também os `owner`/`admin`.

| Código | Quando | Para | Canais |
|---|---|---|---|
| `account_email_confirm` | registo | o próprio | E (enviado pelo Supabase Auth) |
| `org_invite` | convite criado | email convidado | E (por `enqueue_email`) |
| `org_invite_accepted` | convite aceite | quem convidou | P |
| `account_suspended` | conta suspensa | o próprio | E |
| `account_suspended_counterparty` | pedido cancelado por suspensão | a outra parte | P, E |
| `terms_updated` | nova versão dos termos publicada | todas as contas activas | E |
| `request_invited` | convite a um intérprete (directo ou gerido) | intérprete | P, E |
| `request_invite_expired` | convite expirou | solicitante (no gerido, a equipa) | P, E |
| `request_accepted` | um intérprete aceitou | solicitante | P, E |
| `request_declined` | um intérprete recusou | solicitante (no gerido, a equipa) | P, E |
| `request_confirmed` | pedido com todos os intérpretes (e pago, no gerido) | solicitante e intérpretes aceites | P, E |
| `request_understaffed_warning` | faltam intérpretes a `staffing_warning_hours` do início | solicitante (no gerido, a equipa) | P, E |
| `request_expired` | pedido expirou sem intérpretes suficientes | solicitante e intérpretes já aceites | P, E |
| `open_request_new` | pedido aberto publicado | intérpretes elegíveis | P (sem email, para não inundar) |
| `open_application_received` | candidatura num pedido "eu escolho" | solicitante | P |
| `open_application_not_selected` | o solicitante escolheu outro | candidato | P |
| `proposal_received` | nova proposta de preço | a outra parte | P, E |
| `proposal_answered` | proposta aceite ou recusada | quem propôs | P |
| `chat_message` | mensagem nova, se o destinatário não a leu em 10 minutos (tarefa `booking.notify_unread_messages`) | o destinatário | P (E no máximo uma vez por hora por fio) |
| `meeting_link_changed` | o link mudou | solicitante e intérpretes aceites | P, E |
| `request_cancelled` | pedido ou atribuição cancelados | a outra parte | P, E |
| `delivery_marked` | intérprete marcou como feito | solicitante | P, E |
| `delivery_auto_confirmed` | confirmado automaticamente | as duas partes | P |
| `dispute_opened` | disputa aberta | a outra parte; a equipa (`moderator`) | P, E |
| `dispute_resolved` | disputa resolvida | as duas partes | P, E |
| `review_requested` | serviço concluído | as duas partes | P, E |
| `review_revealed` | avaliação revelada | o avaliado | P |
| `review_hidden` | a equipa escondeu uma avaliação | o autor | P, E (com o motivo) |
| `managed_approval_needed` | membro criou um gerido | `owner`/`admin` da organização | P, E |
| `managed_quote_ready` | a equipa fez um orçamento ou contraproposta | solicitante | P, E |
| `managed_new_request` | gerido entrou na fila | `request_operator` | P |
| `payment_requested` | intenção criada | pagador | P, E (com valor, referência e dados bancários) |
| `payment_proof_received` | comprovativo enviado | `finance` | P |
| `payment_review_urgent` | comprovativo por validar a 2 horas do serviço (`D-94`) | `finance` | P, E |
| `payment_confirmed` | comprovativo aceite | pagador | P, E (com o recibo) |
| `payment_proof_rejected` | comprovativo recusado | pagador | P, E (com o motivo) |
| `payment_expiring` | faltam 12 horas para o prazo | pagador | P, E |
| `payment_expired` | prazo passou | pagador | P, E |
| `refund_created` | reembolso criado | pagador | P, E |
| `refund_paid` | reembolso pago | pagador | P, E (com recibo) |
| `payout_queued` | repasse em fila | intérprete | P |
| `payout_paid` | repasse pago | intérprete | P, E |
| `payout_details_missing` | repasse em fila sem IBAN | intérprete | P, E |
| `verification_submitted` | verificação paga e em análise | `moderator` | P |
| `verification_decided` | aprovada, recusada ou com correcções | intérprete | P, E |
| `badge_expiring` | `verification_renewal_notice_days` antes de expirar | intérprete | P, E |
| `badge_revoked` | selo revogado | intérprete | P, E |
| `content_removed` | conteúdo removido | autor | P, E |
| `opportunity_application_received` | candidatura | quem publicou | P, E |
| `opportunity_application_updated` | estado da candidatura mudou | candidato | P |
| `event_registered` | inscrição confirmada | inscrito | P, E |
| `event_cancelled` | evento cancelado | inscritos | P, E |
| `mentorship_requested` | pedido de mentoria | `moderator`; mentor | P |
| `mentorship_decided` | aprovada ou recusada | as duas partes | P, E |
| `ticket_reply` | resposta da equipa | quem abriu | P, E |
| `ticket_new` | ticket aberto | equipa | P |
| `contact_message_new` | mensagem do formulário de contacto | equipa (todos os níveis) | P |

---

## Ecrãs

- **Sino no cabeçalho** (`packages/features`): contador de não lidas, lista das 10 mais recentes, "Marcar todas como lidas", "Ver todas". Actualiza por Realtime.
- **`/notifications`**: todas, paginadas, com filtro lidas/não lidas. **Vazio:** "Não tens notificações."
- **`admin-web` — `/notifications/emails`**: emails `failed`, com destinatário, modelo, último erro e "Reenviar".

## Critérios de aceitação

1. Uma transição que falha a meio não deixa nenhuma notificação nem email na fila.
2. Grep no código: `notify.notifications` e `notify.email_outbox` só são escritas por `notify.enqueue`.
3. Um email que falha quatro vezes fica `failed` e aparece na lista do admin.
4. Cada código da tabela tem pelo menos um teste que o faz disparar, escrito no passo que cria o código; o passo Z confirma que nenhum ficou sem teste e conta-os no relatório final.
