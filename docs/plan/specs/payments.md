# Spec — Pagamentos, reembolsos, repasses e recibos (passo H10)

> Os pagamentos que passam pelo Portal: pedidos geridos, verificação e eventos pagos. Por transferência com comprovativo validado à mão (`ADR-005`). Decisões: `D-30` a `D-37`. Pendentes: `PC-02` a `PC-04`, `PC-06`.

---

## Regras

**R-PAY-01 — intenção de pagamento.** Toda a cobrança começa numa intenção, criada pela função que a justifica, na mesma transacção: `booking.on_payment_event` (gerido), `verification.submit` (verificação), `community.register_for_event` (evento pago). Nenhuma rota cria intenções directamente. Dono: `billing.create_intent`, que:
- lê da versão de configuração do assunto o banco, o IBAN e o beneficiário da Academia; se faltar algum, `CONFIG_VALUE_MISSING` (`R-CFG-04`, `PC-06`);
- calcula os montantes com `billing.split_amount` (`R-PAY-03`);
- gera a referência `PAG-AAAA-NNNNNN` e guarda a cópia dos dados bancários (`bank_snapshot`);
- define o prazo (`due_at`) que cada assunto indica;
- avisa o pagador (`payment_requested`), com o valor, a referência e os dados bancários.

**R-PAY-02 — uma intenção viva por coisa.** No máximo uma intenção `awaiting_proof`, `proof_submitted` ou `confirmed` por assunto (restrição única parcial). Uma segunda tentativa devolve `PAYMENT_ALREADY_PENDING`.

**R-PAY-03 — impostos, numa função só.** `billing.split_amount(base, versão)`: com `prices_include_tax = true`, o preço mostrado já é o total e o imposto é a parte incluída; com `false`, o imposto soma-se. Com `tax_rate_pct = 0` (provisório, `PC-04`), `tax_aoa = 0`. **Nenhum ecrã soma impostos nem escreve uma percentagem**; mostra o que a intenção diz. `verify.py` procura percentagens e somas de imposto no código das apps.

**R-PAY-04 — comprovativo.** O pagador (ou `owner`/`admin` da organização pagadora) carrega o comprovativo por URL assinado (`POST /uploads/sign`, finalidade `payment_proof`; PDF, JPG ou PNG até 10 MB) e regista-o (`POST /payment-intents/:id/proofs`). Um comprovativo pendente de cada vez (`PROOF_ALREADY_PENDING`). A intenção passa a `proof_submitted`, e o assunto também avança (gerido → `payment_review`). A equipa financeira é avisada. Dono: `billing.submit_proof`. Numa organização, só `owner`/`admin` carregam o comprovativo; um `member` vê o estado do pagamento mas não paga (`FORBIDDEN`).

**R-PAY-05 — validar.** Só `finance`. Aceitar: o comprovativo fica `accepted`, a intenção `confirmed`, emite-se o recibo (`R-PAY-12`) e o assunto reage (gerido → `confirmed`; verificação → `under_review`; evento → inscrição `registered`). Recusar: motivo obrigatório; o comprovativo fica `rejected`, a intenção volta a `awaiting_proof` (o pagador pode enviar outro dentro do prazo), o pagador é avisado com o motivo. Dono: `billing.review_proof`.

**R-PAY-06 — prazo.** A tarefa `billing.expire_intents` passa a `expired` as intenções `awaiting_proof` com `due_at` passado. Uma intenção `proof_submitted` **não expira** (o pagador fez a sua parte; a equipa decide). Doze horas antes do prazo, `payment_expiring`. O assunto reage: gerido → `cancelled` (`R-MAN-06`); verificação → volta a `draft`; evento → a inscrição é cancelada e o lugar libertado.
- **Assunto cancelado com a intenção viva** (dono: `billing.cancel_intent_for_subject`): `awaiting_proof` → `cancelled`; `proof_submitted` mantém-se com `subject_cancelled_at`, e o reembolso calculado nesse momento fica em `refund_due_on_confirm_aoa`; se a equipa aceitar o comprovativo, a intenção passa a `confirmed` e o reembolso é criado logo; se recusar, passa a `cancelled`.
- **Comprovativo por validar à hora do serviço** (`D-94`): o serviço mantém-se. Duas horas antes do início, `billing.warn_payment_review` avisa a equipa financeira com urgência (`payment_review_urgent`).

**R-PAY-07 — reembolsos.** Um reembolso é um registo `pending` que a equipa financeira paga por transferência e marca `paid` com a referência. A soma dos reembolsos de uma intenção nunca passa o total pago (`REFUND_EXCEEDS_TOTAL`; dono: `billing.create_refund`, com a intenção fechada `FOR UPDATE`). Só intenções `confirmed` são reembolsáveis. Os automáticos nascem das regras abaixo; os manuais, de `POST /admin/refunds`, com nota obrigatória. Ao marcar `paid`, emite-se recibo de reembolso.

**R-PAY-08 — reembolso da verificação recusada.** `verification_refund_on_reject_pct` da taxa paga (provisório: 0 %), arredondado para baixo ao kwanza. Só na decisão `reject`; `needs_changes` não reembolsa (dá direito a correcção gratuita, `R-VER-05`). Configurável no admin (`D-35`).

**R-PAY-09 — reembolso do gerido cancelado.** Pela versão de configuração do pedido:
- cancelado pelo solicitante com pelo menos `managed_refund_full_until_hours` antes do início → **total** (`managed_cancel_early`);
- cancelado pelo solicitante depois disso → `managed_refund_late_pct` (provisório: 0 %) (`managed_cancel_late`);
- cancelado pela equipa, por suspensão do solicitante ou da organização (`D-90`), ou expirado à hora de início depois de pago → **total** (`provider_failure`, `suspension`; `D-91`);
- um lugar que fica sem intérprete (cancelamento ou suspensão do intérprete, sem substituto, `R-MAN-07`) → reembolso de `managed_unit_price_aoa` desse lugar (`provider_failure`, `D-91`); se o pedido expirar por isso, aplica-se a linha anterior e o reembolso é total;
- o solicitante segue com menos intérpretes depois de pagar → `managed_unit_price_aoa` por lugar retirado (`managed_reduce`, `R-REQ-09`);
- disputa resolvida como cancelada → a decisão do moderador (`R-LIFE-06`).
A base é sempre o que foi cobrado: `managed_unit_price_aoa` por lugar, ou a soma no pedido inteiro (`D-91`). Dono: `billing.managed_refund_amount`, chamada por `booking.cancel_request`, `booking.cancel_assignment`, `booking.reduce_interpreters_needed`, `booking.expire_unstaffed_requests`, `identity.suspend_account` e `booking.resolve_dispute`. O ecrã de cancelamento mostra o valor calculado por esta mesma função antes de confirmar.

**R-PAY-10 — repasses.** Quando uma atribuição de um gerido passa a `completed` **e** a intenção do pedido está `confirmed` (`D-94`; se ainda estiver por validar, o repasse nasce no momento da confirmação), entra em fila um repasse de `interpreter_share_aoa` (`billing.queue_payout`), com cópia dos dados bancários do intérprete. Uma disputa aberta impede o repasse até ser resolvida; resolvida como cancelada, o repasse não nasce (ou fica `cancelled` se já existia). A equipa financeira transfere e marca `paid` com a referência.

**R-PAY-11 — dados para receber.** O intérprete guarda titular, banco e IBAN angolano (`util.iban_ao`). Um repasse em fila sem dados bancários avisa o intérprete (`payout_details_missing`) e não pode ser marcado como pago (`PAYOUT_DETAILS_MISSING`). Quando o intérprete acrescenta os dados, os repasses em fila sem cópia passam a tê-la.

**R-PAY-12 — recibos.** Um recibo por pagamento confirmado e um por reembolso pago, numerados `RC-AAAA-NNNNNN` sem buracos (sequência dentro da transacção), imutáveis, com a cópia dos dados mostrados (`payload`). PDF gerado pela API a partir do `payload`. **Não é uma factura** (`D-36`, `PC-04`): o recibo diz "Documento não fiscal".

**R-PAY-13 — parte do intérprete no gerido.** `interpreter_share_aoa = arredondar_para_cima(agreed_price_aoa × managed_interpreter_share_pct ÷ 100) + agreed_travel_fee_aoa` (a deslocação, quando existir, vai inteira para o intérprete). Arredonda a favor do intérprete. Fixada na aceitação, com a percentagem da versão do pedido. Sem percentagem publicada (`PC-02`), a aceitação de um gerido falha com `CONFIG_VALUE_MISSING`. Dono: `billing.managed_interpreter_share`.

---

## Ecrãs

- **`requester-web` — `/payments`** e o bloco de pagamento no detalhe do pedido: valor (base, imposto, total, como a intenção diz), referência, dados bancários com "Copiar", prazo, "Enviar comprovativo", estado ("À espera do comprovativo", "Comprovativo em análise", "Pago", "Recusado: {motivo}", "Expirou"), recibos para descarregar. **Vazio:** "Não tens pagamentos."
- **`interpreter-web` — `/verification`**: o mesmo bloco para a taxa de verificação. **`/earnings`**: os repasses (em fila, pagos, com referência) e, à parte, os valores acordados nos pedidos directos e abertos, com a nota "Pagos fora do Portal" (`D-30`). **`/settings`**: dados para receber.
- **`admin-web` — `/payments`**: fila de comprovativos pendentes (mais antigos primeiro), com o ficheiro, o valor esperado, a referência, quem pagou, e "Aceitar"/"Recusar". `state=all` mostra o histórico com quem decidiu e quando. **`/refunds`**: pendentes e pagos, "Marcar como pago". **`/payouts`**: em fila e pagos, com o IBAN (cópia) e "Marcar como pago". **Vazio** em cada fila: "Não há {comprovativos} por tratar."

---

## Casos-limite

- **Duplo clique em "Aceitar" no comprovativo:** a segunda chamada encontra a intenção já `confirmed` e devolve `STATE_CHANGED`; com `Idempotency-Key`, devolve a primeira resposta.
- **Pagamento a mais ou a menos:** a equipa recusa o comprovativo com o motivo ("O valor transferido não corresponde: {valor}"); o acerto de diferenças faz-se fora do Portal e regista-se em nota. *(Pagamentos parciais não existem nesta corrida.)*
- **O pagador envia o comprovativo depois do prazo:** a intenção já está `expired` e a rota devolve `INTENT_EXPIRED`; o ecrã explica que o pedido foi cancelado e como contactar o suporte se já transferiu.
- **A configuração muda depois de criada a intenção:** a intenção mantém valores e dados bancários (`bank_snapshot`).
- **Reembolso a uma conta anonimizada:** o reembolso continua a existir; a equipa paga com os dados guardados no comprovativo ou contactando o suporte.

---

## Critérios de aceitação

1. Criar uma intenção sem IBAN da Academia na configuração devolve `CONFIG_VALUE_MISSING`.
2. Duas intenções para o mesmo assunto: a segunda falha na base (`PAYMENT_ALREADY_PENDING`).
3. Dois reembolsos cuja soma passa o total: o segundo falha (`REFUND_EXCEEDS_TOTAL`), mesmo em concorrência.
4. `billing.split_amount` com taxa 14 % e preços com imposto incluído: 114 000 → base 100 000, imposto 14 000; com taxa 0: imposto 0 (testes SQL).
5. A numeração dos recibos não tem buracos mesmo com uma transacção a falhar a meio (teste).
6. A parte do intérprete com 80 % de 15 001 Kz é 12 001 Kz (arredonda para cima).
7. O fluxo do comprovativo (enviar, recusar, reenviar, aceitar, recibo) passa de ponta a ponta e é visto no ecrã do pagador e no do financeiro.
