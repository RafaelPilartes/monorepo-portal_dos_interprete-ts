# Spec — Bolsa de oportunidades e eventos (passo H17)

> Trabalhos longos e eventos com inscrição. Decisões: `D-72`, `D-73`.

---

## Bolsa de oportunidades

**R-OPP-01 — quem publica.** Um `moderator` (em nome da Academia) ou o `owner`/`admin` de uma organização activa. Campos: título, descrição, requisitos, tipo (`freelance`, `contract`, `full_time`, `volunteer`), línguas, local ou remoto, prazo de candidatura, remuneração em texto livre (opcional; é informativa e não passa pelo Portal).

**R-OPP-02 — estados.** `draft` → `open` (publicar) → `closed` (sem mais candidaturas) ou `filled` (preenchida); a equipa remove (`removed`) com motivo. No prazo, a oportunidade `open` passa a `closed` (tarefa diária `community.close_expired_opportunities`). Editável em `draft` e `open`.

**R-OPP-03 — candidaturas.** Qualquer intérprete activo candidata-se a uma oportunidade `open` uma vez (`ALREADY_APPLIED`), com mensagem (até 3 000 caracteres). Pode retirar antes de uma decisão. Quem publicou vê os candidatos (com link para o perfil) e muda o estado: `shortlisted`, `rejected`, `hired`. O candidato é avisado. **As oportunidades não criam pedidos** nem movem dinheiro.

**R-OPP-04 — quem vê.** Oportunidades `open`: intérpretes. Rascunhos e candidaturas: quem publicou (e os `owner`/`admin` da organização), e a equipa. O candidato vê só a sua candidatura.

### Ecrãs

- **`interpreter-web` — `/opportunities`:** lista com filtros (tipo, língua, remoto, cidade), detalhe, "Candidatar-me", "As minhas candidaturas". **Vazio:** "Não há oportunidades abertas neste momento."
- **`requester-web` — `/organization/opportunities`** (`owner`/`admin`): criar, publicar, fechar, ver candidatos.
- **`admin-web` — `/community/opportunities`:** todas; criar em nome da Academia; remover.

---

## Eventos e masterclasses

**R-EVT-01 — publicar.** Um `moderator` cria um evento (título, descrição, tipo, início e fim com `fim > início`, local ou link, lotação opcional, preço em kwanzas — 0 é gratuito —, público: `interpreters` ou `all`, capa) em `draft` e publica.

**R-EVT-02 — inscrever.** Uma conta activa do público certo inscreve-se num evento `published` que ainda não começou. `community.register_for_event` fecha a linha do evento (`FOR UPDATE`) e conta os lugares ocupados (`pending_payment` + `registered`):
- sem lugar: `EVENT_FULL`;
- já inscrito: `ALREADY_REGISTERED`;
- gratuito: `registered` e aviso;
- pago: `pending_payment` e intenção (`R-PAY-01`) com `due_at = min(agora + event_payment_deadline_hours, início do evento)`; o lugar fica reservado enquanto a intenção estiver viva; confirmado o pagamento, `registered`; expirada, a inscrição é cancelada e o lugar libertado.

**R-EVT-03 — cancelar a inscrição.** O próprio cancela antes do início. Paga: reembolso **total** se faltarem pelo menos `event_refund_until_hours`, nada depois (`event_cancel_early`, `R-PAY-07`). O lugar é libertado.

**R-EVT-04 — presenças e fim.** Depois do evento, a equipa marca `attended` ou `no_show`. A tarefa `community.complete_past_events` passa a `completed` os eventos terminados.

**R-EVT-05 — cancelar o evento.** A equipa cancela com motivo: todas as inscrições passam a `cancelled`, as pagas geram reembolso **total** (`event_cancelled`), todos são avisados.

### Ecrãs

- **`interpreter-web` — `/events`** e **`requester-web` — `/events`** (só os de público `all`): próximos e passados, detalhe com lugares livres, preço, "Inscrever-me", o bloco de pagamento quando pago, "Cancelar inscrição". **Vazio:** "Não há eventos marcados."
- **`admin-web` — `/community/events`:** criar, publicar, lista de inscritos com estado de pagamento, presenças, cancelar.

---

## Critérios de aceitação

1. Com lotação 1 e duas inscrições em simultâneo, uma fica e a outra recebe `EVENT_FULL`.
2. Uma inscrição paga com a intenção expirada liberta o lugar.
3. Cancelar o evento cria um reembolso total por cada inscrição paga confirmada.
4. Um solicitante não vê eventos de público `interpreters` nem oportunidades.
5. Candidatar-se duas vezes devolve `ALREADY_APPLIED`.
