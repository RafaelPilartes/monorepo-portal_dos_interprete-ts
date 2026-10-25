# Spec — Ciclo do serviço: cancelar, concluir, disputar (passo H8)

> O que acontece depois de um pedido ter intérpretes. Decisões: `D-21`, `D-22`. O dinheiro dos geridos cancelados está em `payments.md` (`R-PAY-09`).

---

## Regras

**R-LIFE-01 — o solicitante cancela o pedido.** O criador, um `owner`/`admin` da organização, ou a equipa (`moderator`; `request_operator` só nos geridos) cancelam o pedido inteiro, com motivo, enquanto não estiver `delivered`, `completed`, `disputed`, `cancelled` ou `expired` (uma disputa resolve-se por `R-LIFE-06`, não por cancelamento). Dono: `booking.cancel_request`. Na mesma transacção:
- todas as atribuições não terminadas passam a `cancelled` (`cancelled_by_role` = quem cancelou);
- **cancelamento tardio** (`D-22`): se havia pelo menos uma atribuição `accepted` e faltam menos de `cancellation_free_until_hours` para o início, `late_cancellation = true` **nas atribuições aceites**, contado contra o solicitante (`directory.late_cancellations` conta pelo `cancelled_by_role`); cancelado pela equipa nunca é tardio;
- no gerido pago, cria o reembolso pela política (`R-PAY-09`);
- os intérpretes envolvidos são avisados.

**R-LIFE-02 — o intérprete cancela a sua parte.** O intérprete cancela a sua atribuição `accepted`, com motivo, antes do início. Dono: `booking.cancel_assignment`.
- Tardio se faltam menos de `cancellation_free_until_hours` (contado contra o intérprete).
- O lugar reabre: o pedido volta a `awaiting_interpreters` (`R-REQ-04`). No directo, o solicitante é avisado para convidar outro; no aberto, volta a aparecer aos elegíveis; no gerido, volta à fila da equipa (`R-MAN-07`).
- A equipa também pode cancelar uma atribuição (nunca tardio).

**R-LIFE-03 — marcar como feito.** O intérprete marca a sua atribuição `accepted` como `delivered` **a partir da hora de fim do serviço** (`NOT_FINISHED_YET`). Dono: `booking.mark_delivered`. O solicitante é avisado (`delivery_marked`).

**R-LIFE-04 — confirmar.** O solicitante confirma uma atribuição `delivered`, que passa a `completed` (`completed_via = 'requester'`). Se não confirmar nem abrir disputa em `completion_auto_confirm_hours`, a tarefa `booking.auto_confirm_deliveries` confirma (`completed_via = 'auto'`). Quando todas as atribuições activas estão `completed`, o pedido fica `completed` (`R-REQ-04`). No gerido, cada atribuição concluída põe o repasse em fila (`R-PAY-10`). Dono: `booking.confirm_delivery`.

**R-LIFE-05 — disputa.** Qualquer das partes abre uma disputa sobre uma atribuição `accepted` (depois do início) ou `delivered` (antes de passar a `completed`), com motivo. A atribuição passa a `disputed`, o prazo de confirmação automática deixa de contar, a equipa e a outra parte são avisadas. Uma disputa aberta de cada vez por atribuição (`DISPUTE_OPEN`). Dono: `booking.open_dispute`.

**R-LIFE-06 — resolver.** Um `moderator` resolve, com notas obrigatórias:
- `completed`: o serviço conta como feito (`completed_via = 'staff'`); no gerido, o repasse entra em fila;
- `cancelled`: o serviço não conta; no gerido, decide o reembolso: `full`, `policy` (a regra de `R-PAY-09` pela hora a que o serviço devia ter sido) ou `none`.
O moderador lê o chat do pedido pela API (`R-PRIV-05`). Um membro da equipa que seja parte do pedido não decide (`staff-and-config.md`). Dono: `booking.resolve_dispute`.

**R-LIFE-07 — fim do pedido.** O pedido termina `completed` quando todas as atribuições activas estão `completed`; as `cancelled` não contam. Um pedido com uma atribuição concluída e outra cancelada numa disputa fica `completed`.

---

## Ecrãs

- **`requester-web` — detalhe:** "Cancelar pedido" (com o motivo e, se for tardio, o aviso "Faltam menos de 24 horas: este cancelamento fica registado no teu perfil"; no gerido pago, o valor a reembolsar pela política, vindo da base, antes de confirmar). Por intérprete `delivered`: "Confirmar que o serviço foi feito" e "Abrir disputa", com o prazo da confirmação automática.
- **`interpreter-web` — detalhe:** "Cancelar a minha participação" (com o mesmo aviso de tardio), "Marcar como feito" (activo só depois da hora de fim), "Abrir disputa".
- **`interpreter-web` — `/schedule`:** os serviços aceites em calendário e lista, com os que estão por marcar como feitos em destaque.
- **`admin-web` — `/requests/:id`:** o painel da disputa (motivo, quem abriu, chat, linha do tempo) com "Resolver".
- **Estados de erro:** cada acção mostra a mensagem do catálogo; uma acção sobre um estado que mudou mostra `STATE_CHANGED` e recarrega o detalhe.

---

## Casos-limite

- **Cancelamento exactamente a 24 horas:** "menos de 24 horas" é estrito; a 24h00 certas não é tardio.
- **O intérprete esquece-se de marcar como feito:** o solicitante não pode confirmar o que não foi marcado; a equipa resolve por disputa aberta pelo solicitante ou pelo intérprete. *(Nesta corrida não há marcação automática; uma tarefa que lembre o intérprete 2 horas depois do fim fica registada como melhoria em `auto-decisions.md` se o Claude Code a quiser acrescentar, avisando com `delivery_reminder`.)*
- **Suspensão a meio de um serviço:** os serviços já começados mantêm-se (`R-ACC-05`).
- **Um de dois intérpretes cancela a 2 horas do início:** o lugar reabre e o pedido volta a `awaiting_interpreters`; à hora de início aplica-se `R-REQ-10` (o solicitante pode "Seguir com 1").

---

## Critérios de aceitação

1. Cancelar a 23 horas do início com um intérprete aceite marca `late_cancellation` na atribuição e soma 1 a `directory.late_cancellations` do solicitante.
2. Cancelar a 25 horas não marca nada.
3. `mark_delivered` antes da hora de fim devolve `NOT_FINISHED_YET`.
4. Uma entrega sem resposta passa a `completed` com `completed_via = 'auto'` depois do prazo (teste com o relógio da base avançado).
5. Uma disputa aberta impede a confirmação automática.
6. Resolver como `cancelled` com `refund_decision = 'full'` num gerido pago cria um reembolso de `managed_unit_price_aoa` dessa atribuição (`D-91`). *Fecha no H11, quando o gerido existe.*
