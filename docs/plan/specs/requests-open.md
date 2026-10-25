# Spec — Pedido aberto (passo H7)

> O pedido fica visível aos intérpretes elegíveis. Dois modos, escolhidos ao criar (`D-11`). Depende de `requests-core.md` e `negotiation.md`.

---

## Regras

**R-OPN-01 — quem vê um pedido aberto.** Os intérpretes elegíveis (`R-DIR-09`), enquanto o pedido estiver em `awaiting_interpreters` e houver lugar. A vista `booking.open_requests_for_me` mostra o pedido sem o beneficiário e sem a morada (só a cidade). Ao publicar, os elegíveis recebem `open_request_new` (só no Portal).

**R-OPN-02 — modo "o primeiro que aceitar".** O intérprete aceita ao preço do orçamento (`budget_per_interpreter_aoa`), que é tudo incluído: sem deslocação à parte (`D-92`). O ecrã do intérprete mostra-o antes de aceitar. A aceitação (`booking.accept_open_request`):
- fecha a linha do pedido (`FOR UPDATE`) e conta os aceites;
- se ainda há lugar, cria a atribuição já `accepted`, com o preço fixado e o período (a sobreposição decide aqui, `R-REQ-05`);
- se não há, `SLOTS_FULL`.
Os primeiros N ficam. Sem negociação (`R-NEG-01`). Sem candidaturas.

**R-OPN-03 — modo "eu escolho": candidaturas.** O intérprete candidata-se (`booking.apply_to_request`), o que cria uma atribuição `applied` com `offered_price_aoa` = o seu preço para o serviço (`R-REQ-02`), a sua deslocação, e uma mensagem opcional. A candidatura é uma oferta firme até ser retirada (`booking.withdraw_application`) ou a negociação a mudar (`negotiation.md`). Não há limite de candidatos.

**R-OPN-04 — modo "eu escolho": selecção.** O solicitante escolhe um candidato (`booking.select_candidate`):
- a selecção vale como aceitação (`D-14`): fixa o preço proposto em vigor, escreve o período, passa a `accepted`;
- se o candidato já tiver outro serviço aceite no mesmo horário, a selecção falha com `SCHEDULE_OVERLAP` e o ecrã diz "Este intérprete já não está disponível neste horário";
- quando os lugares ficam todos ocupados, as candidaturas restantes passam a `not_selected` e os candidatos são avisados.

**R-OPN-05 — fim.** Sem lugares preenchidos à hora de início: `R-REQ-10`. O solicitante pode também deixar de receber candidaturas cancelando o pedido, ou seguindo com menos (`R-REQ-09`).

---

## Ecrãs

- **`interpreter-web` — `/open-requests`**: os pedidos abertos para mim, com serviço, línguas, cidade ou "online", data e duração, urgente, modo, e o valor: no "primeiro que aceitar", o orçamento; no "eu escolho", o meu preço calculado. Filtros por data, modalidade e cidade. Botões "Aceitar" ou "Candidatar-me". Actualiza por Realtime: um pedido que fica cheio desaparece da lista. **Vazio:** "Não há pedidos abertos para ti neste momento. Completar o perfil e acrescentar línguas e serviços aumenta os pedidos que vês."
- **`requester-web` — detalhe de um aberto "eu escolho"**: lista de candidatos com fotografia, avaliação, cancelamentos tardios, preço, mensagem, link para o perfil, chat com cada um, e "Escolher". Lugares: "1 de 2 escolhidos".
- **`requester-web` — detalhe de um aberto "o primeiro que aceitar"**: "À espera de intérpretes ({aceites} de {necessários})", actualizado por Realtime.

---

## Casos-limite

- **Dois intérpretes aceitam o último lugar ao mesmo tempo:** o `FOR UPDATE` serializa; o segundo recebe `SLOTS_FULL`.
- **O candidato escolhido entretanto aceitou outro serviço no mesmo horário:** `SCHEDULE_OVERLAP` na selecção; os outros candidatos mantêm-se.
- **O intérprete deixa de ser elegível depois de se candidatar:** a candidatura mantém-se; a elegibilidade decide-se ao candidatar.
- **O solicitante é membro da organização e o intérprete também:** não é elegível (`R-DIR-09`).

---

## Critérios de aceitação

1. Com 2 lugares e 3 aceitações simultâneas no modo "o primeiro que aceitar", ficam exactamente 2 `accepted` e a terceira recebe `SLOTS_FULL` (teste concorrente).
2. No modo "eu escolho", seleccionar um candidato fixa o preço proposto em vigor e passa os restantes a `not_selected` quando o pedido fica completo.
3. Um intérprete não elegível não vê o pedido na vista nem consegue candidatar-se pela API.
4. O beneficiário não aparece na vista dos pedidos abertos.
