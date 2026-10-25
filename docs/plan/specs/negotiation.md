# Spec — Negociação de preço (passo H6)

> Propostas de preço no chat do pedido. Decisões: `D-13`, `D-14`. Substitui o `RequestNegotiationChat.tsx` de hoje, que guardava tudo em memória.

---

## Regras

**R-NEG-01 — quem negoceia, e quando.**
- **Directo e aberto "eu escolho":** o solicitante (criador ou `owner`/`admin` da organização) e o intérprete da atribuição, no fio deles, enquanto a atribuição estiver `invited` ou `applied`.
- **Gerido:** o solicitante e a equipa (`request_operator`, `moderator`), no fio solicitante–equipa, enquanto o pedido estiver em `quoting`.
- **Aberto "o primeiro que aceitar":** não há negociação; aceita-se o orçamento.
- Depois de a atribuição ser aceite (ou de o orçamento do gerido ser aceite), a negociação fecha (`NEGOTIATION_CLOSED`).

**R-NEG-02 — uma proposta aberta de cada vez.** Em cada fio há no máximo uma proposta `open` (restrição única parcial). Fazer uma contraproposta passa a anterior a `void`. Recusar deixa o preço proposto como estava.

**R-NEG-03 — aceitar uma proposta.** A outra parte aceita (não a própria, `OWN_PROPOSAL`). O valor passa a ser o preço proposto:
- directo/aberto: `request_assignments.offered_price_aoa`;
- gerido: o orçamento em vigor do pedido (que `booking.accept_quote` grava como `managed_unit_price_aoa`).

**Uma proposta aceite ainda não é o preço final** (`D-14`): o preço fecha quando o intérprete aceita o pedido (`R-DRC-03`, `R-OPN-04`), ou, no gerido, quando o solicitante aceita o orçamento (`R-MAN-03`). Dono: `booking.respond_proposal`.

**R-NEG-04 — intérprete que não negoceia.** Se `accepts_negotiation = false`, o solicitante não pode propor (`NEGOTIATION_DISABLED`); o intérprete pode, se quiser oferecer outro valor.

**R-NEG-05 — o que uma proposta é.** Um valor por intérprete, em kwanzas inteiros, maior que zero, **sem** a taxa de deslocação (que se mantém à parte e não se negoceia). Nos serviços à hora, o valor proposto é o total do serviço, não o preço por hora. O ecrã mostra os dois lados: "Proposta: 18 000 Kz (era 15 000 Kz) + deslocação 2 000 Kz."

---

## Ecrãs

No chat do pedido (`packages/features`):
- Botão "Propor outro preço" (quando permitido): campo em kwanzas, com o preço actual por baixo.
- A proposta aparece como um cartão no meio das mensagens: quem propôs, valor, estado. Para a outra parte, com "Aceitar" e "Recusar". Propostas `void` aparecem riscadas com "Substituída por uma nova proposta".
- Fora de prazo: o botão desaparece e aparece "A negociação está fechada."

---

## Casos-limite

- **As duas partes propõem ao mesmo tempo:** a restrição única deixa entrar só uma; a segunda função faz `void` à primeira e insere a sua, porque a contraproposta é a acção mais recente. Ambas as partes veem o resultado por Realtime.
- **O intérprete aceita o pedido com uma proposta aberta:** a proposta passa a `void` e vale o `offered_price_aoa` em vigor no momento (o último aceite).
- **Proposta de 0 ou negativa:** `INVALID_AMOUNT` no campo.

---

## Critérios de aceitação

1. Duas propostas seguidas no mesmo fio deixam exactamente uma `open`.
2. Aceitar a própria proposta devolve `OWN_PROPOSAL`.
3. Depois de o intérprete aceitar, propor devolve `NEGOTIATION_CLOSED`.
4. Uma proposta aceite muda `offered_price_aoa`; só a aceitação do pedido escreve `agreed_price_aoa`.
5. Num aberto "o primeiro que aceitar", o botão "Propor" não aparece e a API recusa.
