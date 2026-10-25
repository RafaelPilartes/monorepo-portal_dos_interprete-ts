# Spec — Pedido gerido (passo H11)

> O solicitante pede à plataforma, que arranja o intérprete. É a única receita sobre serviços. Depende de `requests-core.md`, `negotiation.md` e `payments.md`. Decisões: `D-06`, `D-12`, `D-13`, `D-31` a `D-33`.

---

## Fluxo

```
criar ─► [awaiting_approval] ─► quoting ─► awaiting_interpreters ─► awaiting_payment ─► payment_review ─► confirmed ─► …
          (membro de org)       orçamento     a equipa atribui         intenção criada     comprovativo       pago
                                negociação    os intérpretes aceitam
```

## Regras

**R-MAN-01 — aprovação na organização.** Um gerido criado por um `member` de uma organização começa em `awaiting_approval`; os `owner`/`admin` são avisados (`managed_approval_needed`) e aprovam (→ `quoting`) ou recusam com motivo (→ `cancelled`). Criado por um particular, `owner` ou `admin`, começa em `quoting`. Sem aprovação à hora de início, expira (`R-REQ-10`). Dono: `booking.approve_managed_request`, `booking.reject_managed_request`.

**R-MAN-02 — orçamento inicial.** Ao entrar em `quoting`, o orçamento por intérprete é `catalog.quote_service` com o `platform_price_aoa` do serviço (`R-REQ-02`). O solicitante vê-o logo, com o total para `interpreters_needed`. A fila da equipa recebe o pedido (`managed_new_request`).

**R-MAN-03 — negociar e aceitar o orçamento.** Em `quoting`, o solicitante e a equipa negoceiam por propostas no fio solicitante–equipa (`negotiation.md`). O solicitante (criador ou `owner`/`admin`) aceita o orçamento em vigor (`booking.accept_quote`), o que grava `managed_unit_price_aoa`, fecha a negociação e passa a `awaiting_interpreters`. A partir daqui o preço do solicitante não muda.

**R-MAN-04 — atribuir.** A equipa (`request_operator`, `moderator`) convida intérpretes elegíveis (`R-DIR-09`): atribuições `invited` com `origin = 'team_assigned'` e `offered_price_aoa = managed_unit_price_aoa`. O intérprete vê, antes de aceitar, **o valor que recebe**: `billing.managed_interpreter_share` sobre o preço (sem percentagem publicada, a atribuição é recusada com `CONFIG_VALUE_MISSING`, `PC-02`). Aceitar fixa preço, parte e período (`R-DRC-03`, `R-PAY-13`). Recusar ou expirar avisa a equipa, que atribui outro. O intérprete **não negoceia** no gerido: aceita ou recusa. Dono: `booking.assign_interpreter`.

**R-MAN-05 — cobrar.** Quando os aceites chegam a `interpreters_needed`, o pedido passa a `awaiting_payment` e nasce a intenção (`R-PAY-01`) de `managed_unit_price_aoa × interpreters_needed`, com `due_at = min(agora + managed_payment_deadline_hours, starts_at)`. O comprovativo passa o pedido a `payment_review`; aceite, a `confirmed` (`request_confirmed` a todos). Recusado, volta a `awaiting_payment`. Dono: `booking.on_payment_event`.

**R-MAN-06 — não pago.** Se a intenção expira (`R-PAY-06`), o pedido passa a `cancelled` e as atribuições aceites a `cancelled` com `cancelled_by_role = 'system'`, sem cancelamento tardio para ninguém. Intérpretes e solicitante são avisados.

**R-MAN-07 — um intérprete sai depois de pago.** Se um intérprete cancela ou é suspenso (`D-90`) num gerido `confirmed`, o pedido volta a `awaiting_interpreters` (sem nova cobrança: o pagamento confirmado mantém-se) e a equipa atribui um substituto. Sem substituto à hora de início, o pedido expira (`R-REQ-10`) e o reembolso é **total**, porque o serviço não acontece (`D-91`, `R-PAY-09`). Se o solicitante decidir seguir com menos, o lugar retirado é reembolsado (`managed_reduce`, `R-REQ-09`).

**R-MAN-08 — concluir e pagar ao intérprete.** Cada atribuição concluída gera o repasse (`R-PAY-10`).

---

## Ecrãs

- **`requester-web` — detalhe de um gerido:** a barra de progresso do fluxo acima; o orçamento com "Aceitar orçamento" e "Propor outro valor"; o fio com a equipa; depois, os intérpretes atribuídos (nome, perfil) e o bloco de pagamento. Para um `member` em `awaiting_approval`: "À espera de aprovação de {nomes dos responsáveis}".
- **`requester-web` — `/organization/approvals`** (`owner`/`admin`): geridos por aprovar, com "Aprovar" e "Recusar".
- **`admin-web` — `/requests/managed`:** a fila por estado (`quoting`, `awaiting_interpreters`, `awaiting_payment`, `payment_review`), mais urgentes primeiro. No detalhe: o fio com o solicitante e as propostas; "Atribuir intérprete" abre a lista de elegíveis com disponibilidade, avaliação e cancelamentos tardios; o estado de cada convite. **Vazio:** "Não há pedidos geridos por tratar."
- **`interpreter-web` — convite de um gerido:** igual ao directo, com "Vais receber {valor} (a parte do intérprete neste pedido)" em vez do preço do solicitante.

---

## Casos-limite

- **A configuração muda a percentagem entre a criação e a aceitação do intérprete:** vale a percentagem da versão do **pedido** (`R-CFG-03`).
- **Urgente para daqui a 3 horas:** `due_at` fica à hora de início; o ecrã diz "Paga antes de {hora} para confirmar".
- **O solicitante cancela em `awaiting_payment`:** a intenção passa a `cancelled`, as atribuições também, sem tardio para os intérpretes.
- **Dois intérpretes, um aceita e outro recusa:** o pedido continua em `awaiting_interpreters`; a cobrança só nasce quando ambos os lugares estão aceites.

---

## Critérios de aceitação

1. Um gerido criado por um `member` fica `awaiting_approval` e o `owner` recebe o aviso; aprovar passa a `quoting`.
2. Aceitar o orçamento grava `managed_unit_price_aoa`; uma proposta depois disso devolve `NEGOTIATION_CLOSED`.
3. Sem `managed_interpreter_share_pct` publicado, `POST /admin/requests/:id/assign` devolve `CONFIG_VALUE_MISSING`.
4. Com todos os lugares aceites nasce exactamente uma intenção com o total certo.
5. Uma intenção expirada cancela o pedido e as atribuições, sem tardio.
6. O fluxo completo, de criar a repasse pago, passa num teste de integração e é visto no ecrã nas três apps (solicitante, intérprete, admin).
