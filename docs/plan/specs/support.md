# Spec — Suporte e contacto (passo H15)

> Tickets para quem tem conta e o formulário de contacto do site. Decisão: `D-79`.

---

## Regras

**R-SUP-01 — tickets.** Qualquer conta activa abre um ticket com categoria (`technical`, `billing`, `account`, `complaint`, `suggestion`, `other`), assunto, mensagem e anexo opcional (PDF, JPG ou PNG até 5 MB). Código `SUP-AAAA-NNNNNN`. Estados:

| De | Para | Quem |
|---|---|---|
| (novo) | `open` | quem abre |
| `open` | `in_progress` | equipa |
| `in_progress` | `waiting_user` | equipa, ao responder e pedir informação |
| `waiting_user` | `in_progress` | automático, quando o utilizador responde |
| qualquer aberto | `resolved` | equipa |
| `resolved` | `in_progress` | automático, se o utilizador responder |
| `resolved` | `closed` | quem abriu, ou automático (`R-SUP-04`) |
| qualquer aberto | `closed` | quem abriu |

A equipa define prioridade e responsável. Cada resposta da equipa avisa quem abriu (`ticket_reply`). Dono: `support.*` (API).

**R-SUP-02 — formulário de contacto.** `POST /contact`, público, com limite de 5 por hora por IP e um campo-armadilha (`website`) que tem de vir vazio (se vier preenchido, a API responde sucesso e não grava nada). Cria `support.contact_messages` `new` e avisa a equipa (`contact_message_new`). A equipa marca como tratada, e pode convertê-la num ticket se o email corresponder a uma conta. O site mostra a confirmação **só** depois da resposta `201`.

**R-SUP-03 — notas internas.** A equipa pode escrever notas internas num ticket; nunca são lidas por quem abriu (política RLS em `ticket_messages`).

**R-SUP-04 — fecho automático.** Um ticket `resolved` sem resposta do utilizador em `support_autoclose_days` passa a `closed` (`support.autoclose_resolved`).

---

## Ecrãs

- **`packages/features` — centro de suporte (`/support` em `requester-web` e `interpreter-web`):** "Novo pedido de ajuda", lista dos meus tickets com estado, e o detalhe com a conversa. **Vazio:** "Não tens pedidos de ajuda abertos."
- **`site-web` — `/contact`:** o formulário de hoje, ligado à API, com validação no campo e a mensagem de sucesso só depois da resposta. Erro de limite: a mensagem de `RATE_LIMITED`.
- **`admin-web` — `/support/tickets`:** fila por estado e prioridade (sem `state`: `open`, `in_progress`, `waiting_user`), atribuir a mim, responder, nota interna, mudar estado. **`/support/contact-messages`:** fila `new`, "Marcar como tratada", "Converter em ticket".

---

## Critérios de aceitação

1. Um ticket com uma nota interna: quem abriu lê zero linhas dessa nota por RLS.
2. Responder a um ticket `waiting_user` passa-o a `in_progress`.
3. O sexto envio do formulário de contacto numa hora pelo mesmo IP devolve `RATE_LIMITED`.
4. Um envio com o campo-armadilha preenchido devolve `201` e não grava nada.
5. Um ticket `resolved` há mais de `support_autoclose_days` fica `closed` depois da tarefa.
