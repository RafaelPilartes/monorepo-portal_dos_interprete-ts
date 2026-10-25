# Spec — Avaliações (passo H9)

> As duas partes avaliam-se depois do serviço. Decisões: `D-43`, `D-44`.

---

## Regras

**R-REV-01 — quem avalia, e quando.** Em cada atribuição `completed`, o solicitante avalia o intérprete e o intérprete avalia o solicitante (o criador do pedido; numa organização, a avaliação vai para a conta que criou o pedido). Uma avaliação por lado por atribuição (`REVIEW_EXISTS`), de 1 a 5 estrelas, com comentário opcional até 2000 caracteres. Prazo: `review_window_days` depois de `completed_at` (`REVIEW_WINDOW_CLOSED`). Não se edita nem se apaga depois de enviada. Dono: `booking.submit_review`.

**R-REV-02 — revelação dupla-cega.** Uma avaliação fica escondida até as duas partes terem avaliado, ou até passarem `review_reveal_days` depois de `completed_at`, o que vier primeiro. Ninguém vê a avaliação do outro antes de dar a sua. Dono: gatilho em `booking.reviews` (revela as duas quando chega a segunda) + tarefa `booking.reveal_reviews` (revela por prazo). O avaliado é avisado (`review_revealed`).

**R-REV-03 — quem vê.**
- Avaliações a intérpretes, reveladas e não escondidas: qualquer conta activa, no perfil.
- Avaliações a solicitantes, reveladas e não escondidas: **só intérpretes** que tenham uma atribuição (convidado, candidato ou atribuído) num pedido criado por esse solicitante (`D-44`). Dono: `auth_helper.can_view_requester_reviews`.
- O autor vê sempre a sua; a equipa vê todas.

**R-REV-04 — esconder.** Um `moderator` esconde uma avaliação com motivo (por exemplo, linguagem ofensiva, dados pessoais), na sequência de uma denúncia ou por iniciativa própria. Fica na auditoria; o autor é avisado (`review_hidden`). Não se apaga.

**R-REV-05 — média.** A média e a contagem vêm da vista `directory.interpreter_ratings` (`R-DIR-05`). O solicitante tem a mesma vista para os intérpretes que o podem ver (`booking.requester_ratings`).

---

## Ecrãs

- **Pedido de avaliação** (depois de `completed`): no detalhe do pedido e em `/reviews`, um cartão "Avalia o teu serviço com {nome}" com estrelas e comentário. Depois de enviar: "Obrigado. A tua avaliação fica visível quando {nome} também avaliar, ou daqui a {N} dias."
- **`requester-web` — `/reviews`:** separadores "Por avaliar", "Que fiz", "Que recebi" (as reveladas).
- **`interpreter-web` — `/reviews`:** igual, do lado do intérprete. Ao receber um pedido de um solicitante com avaliações, o detalhe do pedido mostra a média dele e as avaliações (`R-REV-03`).
- **`admin-web`:** as avaliações aparecem nas fichas de contas e nas denúncias, com "Esconder".

---

## Casos-limite

- **Avaliar um serviço cancelado:** impossível (`REVIEW_NOT_ALLOWED`).
- **Um pedido com dois intérpretes:** o solicitante avalia cada um separadamente; cada intérprete avalia o solicitante separadamente.
- **A conta do autor é anonimizada:** a avaliação fica, com o autor "Conta removida".

---

## Critérios de aceitação

1. Com só uma das partes a avaliar, a avaliação não aparece a ninguém além do autor e da equipa.
2. Quando a segunda parte avalia, as duas ficam visíveis no mesmo instante.
3. Uma avaliação sem resposta aparece ao fim de `review_reveal_days` (teste com o relógio avançado).
4. Um solicitante não consegue ler, por RLS, as avaliações feitas a outro solicitante; um intérprete convidado por ele consegue.
5. Uma avaliação escondida não entra na média.
