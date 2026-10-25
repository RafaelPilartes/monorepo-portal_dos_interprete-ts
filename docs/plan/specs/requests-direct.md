# Spec — Pedido directo (passo H5)

> O solicitante escolhe o intérprete. Depende de `requests-core.md`. Decisões: `D-10`, `D-14`, `D-24`.

---

## Regras

**R-DRC-01 — convidar.** O solicitante convida intérpretes elegíveis (`R-DIR-09`) na criação (`interpreter_ids`) ou depois (`POST /requests/:id/invites`). A soma de convites pendentes e atribuições aceites nunca passa `interpreters_needed` (`SLOTS_FULL`). Cada convite cria uma atribuição `invited`, com `offered_price_aoa` = `catalog.quote_service` com o preço do intérprete para o serviço, e `offered_travel_fee_aoa` = a taxa de deslocação dele (presencial). Não se convida duas vezes o mesmo intérprete no mesmo pedido. Dono: `booking.invite_interpreter`.

**R-DRC-02 — expiração do convite.** `invite_expires_at = min(criação + invite_expiry_hours, starts_at)` (`D-24`); num pedido urgente, a hora de início. A tarefa `booking.expire_invites` passa a `expired` os convites vencidos e avisa o solicitante (`request_invite_expired`).

**R-DRC-03 — aceitar.** O intérprete convidado aceita (`booking.accept_assignment`), numa transacção que:
- fecha a linha do pedido (`FOR UPDATE`);
- confirma que o convite está `invited` e não expirou (`INVITE_EXPIRED`), e que há lugar (`SLOTS_FULL`);
- **fixa o preço** (`D-14`): `agreed_price_aoa = offered_price_aoa` (já actualizado por uma proposta aceite, se houver), `agreed_travel_fee_aoa = offered_travel_fee_aoa`;
- escreve `period` e passa a `accepted` (a restrição de sobreposição decide aqui, `R-REQ-05`);
- fecha a negociação desse fio (as propostas `open` passam a `void`);
- chama `booking.refresh_request_status` e avisa o solicitante.

**R-DRC-04 — recusar.** O intérprete recusa com motivo (texto obrigatório, mínimo 3 caracteres). O solicitante é avisado com o motivo. Dono: `booking.decline_assignment`.

**R-DRC-05 — substituir.** Depois de uma recusa ou expiração, o lugar fica livre: o solicitante convida outro (mesma regra de `R-DRC-01`), segue com menos (`R-REQ-09`), ou cancela.

---

## Ecrãs

- **`requester-web` — detalhe do pedido**: por intérprete, o estado ("Convidado, responde até {data}", "Aceite", "Recusou: {motivo}", "Expirou"), o preço proposto ou acordado, e o chat. Acções: "Convidar outro intérprete" (quando há lugar), "Seguir com {N}", "Cancelar pedido".
- **`interpreter-web` — `/requests`**: separadores "Convites" (com o prazo de resposta em destaque), "Aceites", "Terminados". **Vazio:** "Não tens convites neste momento."
- **`interpreter-web` — detalhe**: o pedido (sem o beneficiário até aceitar), o preço proposto com o cálculo (minutos cobráveis × preço/hora + deslocação), aviso se estiver fora da sua disponibilidade, e os botões "Aceitar" e "Recusar" (com o motivo). Ao aceitar com sobreposição: a mensagem `SCHEDULE_OVERLAP` e o link para o serviço que coincide.

---

## Casos-limite

- **O intérprete aceita no mesmo segundo em que o convite expira:** a função compara com `util.now()` dentro da transacção; quem chega depois do prazo recebe `INVITE_EXPIRED`.
- **O intérprete mudou o preço do serviço depois de ser convidado:** o convite mantém o `offered_price_aoa` do momento do convite; o novo preço vale para convites novos.
- **O intérprete deixou de ser elegível** (removeu a língua) com um convite pendente: pode aceitar na mesma, porque o convite foi feito quando era elegível; a elegibilidade decide-se ao convidar.
- **O solicitante cancela enquanto o intérprete está a aceitar:** quem fechar a linha primeiro ganha; o outro recebe `STATE_CHANGED`.

---

## Critérios de aceitação

1. Convidar um intérprete não elegível devolve `INTERPRETER_NOT_ELIGIBLE` com o motivo.
2. Com `interpreters_needed = 1` e um convite pendente, um segundo convite devolve `SLOTS_FULL`.
3. Aceitar fixa `agreed_price_aoa`; mudar depois o preço do serviço no perfil não altera o pedido.
4. Um convite feito 3 horas antes de um serviço urgente expira à hora de início, não 48 horas depois.
5. Aceitar fecha as propostas abertas do fio (passam a `void`).
6. O fluxo completo — criar directo, convidar, aceitar, confirmar — passa num teste de integração da API e é visto no ecrã nas duas apps.
