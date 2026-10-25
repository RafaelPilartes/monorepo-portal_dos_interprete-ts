# Spec — Pedidos: o núcleo comum (passo H5)

> O que é igual nos três tipos de pedido: criação, preço, estados, sobreposição, visibilidade, chat, expiração. Os tipos têm specs próprias: `requests-direct.md`, `requests-open.md`, `requests-managed.md`. Decisões: `D-10` a `D-20`, `D-23`, `D-24`, `D-52`.

---

## Regras

**R-REQ-01 — criar um pedido.** `booking.create_request` valida, na base, tudo o que se segue, e grava o pedido, as línguas, os convites iniciais (se directo) e o primeiro evento do registo, numa só transacção:
- quem cria é solicitante; se indicar `organization_id`, é membro activo dela e a organização está `active`;
- o serviço está activo; há pelo menos uma língua, todas activas;
- `starts_at ≥ agora + request_min_lead_minutes` (`START_TOO_SOON`);
- `duration_minutes` entre 15 e 720 (`DURATION_OUT_OF_RANGE`);
- `interpreters_needed` entre 1 e `max_interpreters_per_request` (`TOO_MANY_INTERPRETERS`);
- online exige `meeting_link` começado por `https://`; presencial exige `address`;
- aberto exige `open_mode`; "o primeiro que aceitar" exige `budget_per_interpreter_aoa > 0`;
- `is_urgent = starts_at < agora + urgent_threshold_hours` (`D-19`), calculado aqui e guardado;
- `config_version_id = config.current_version_id()` (`R-CFG-03`);
- **gerido:** a versão em vigor tem de ter `managed_interpreter_share_pct` e os dados bancários da Academia (`config.require`, `CONFIG_VALUE_MISSING`), para nenhum gerido ficar preso numa versão sem esses valores (`PC-02`, `PC-06`);
- o total que o ecrã mostrou na revisão vem em `expected_total_aoa`; se o total calculado agora for diferente, `PRICE_CHANGED`;
- estado inicial: `awaiting_interpreters` (directo, aberto), `quoting` (gerido de particular, ou de `owner`/`admin`), `awaiting_approval` (gerido criado por `member`, `R-MAN-01`).

**R-REQ-02 — o preço de um serviço.** Uma só função calcula: `catalog.quote_service`.
- **À hora:** minutos cobráveis = `max(billing_minimum_minutes, arredondar_para_cima(duração, billing_round_minutes))`; valor = `arredondar_para_cima(preço_unitário × minutos_cobráveis ÷ 60)`, em kwanzas inteiros.
- **Fixo:** valor = preço unitário.
- O preço unitário é: no directo e no aberto "eu escolho", o preço do intérprete para esse serviço; no gerido, `platform_price_aoa` do serviço.
- No aberto "o primeiro que aceitar" **não há cálculo**: o orçamento por intérprete é o valor final, tudo incluído (`D-92`).
- A **taxa de deslocação** (`D-17`) soma-se à parte, por intérprete, só no presencial e só no directo e no aberto "eu escolho". No gerido, a equipa inclui a deslocação no orçamento.
- O **total do pedido** é a soma, por intérprete, do valor mais a deslocação. Dono: `booking.preview_request_total`, que usa `catalog.quote_service`. **O ecrã nunca faz esta conta**: pede-a por RPC e mostra o resultado.
- A configuração usada é a do pedido (`R-CFG-03`).

**R-REQ-03 — código legível.** `PI-AAAA-NNNNNN`, sequencial por ano, de `util.next_code('PI')`.

**R-REQ-04 — o estado do pedido deriva das atribuições.** Depois da criação (e, no gerido, da aceitação do orçamento), o estado do pedido é **derivado** das atribuições activas e da intenção de pagamento, por `booking.refresh_request_status`, com a ordem de precedência escrita em `data-model.md` §5 ("Estados derivados"). É lá que a regra vive; esta spec não a repete. A função é chamada no fim de cada função que muda uma atribuição ou uma intenção do pedido.

**R-REQ-05 — sem sobreposição.** Um intérprete não tem duas atribuições `accepted` ou `delivered` cujos períodos (`[início, fim + overlap_buffer_minutes)`: a margem fica só depois de cada serviço) se cruzem. Dono: a restrição `EXCLUDE` em `booking.request_assignments`. A função de aceitação traduz a violação em `SCHEDULE_OVERLAP`. A margem vem da configuração do **pedido a aceitar**.

**R-REQ-06 — o que não muda depois de alguém aceitar.** Depois da primeira atribuição `accepted`, não mudam: serviço, modalidade, data, hora, duração, morada, tipo, modo (`REQUEST_LOCKED`; dono: gatilho `booking.guard_request_immutables`). O link da reunião muda por `booking.update_meeting_link`: o criador antes da primeira aceitação; qualquer intérprete aceite até ao início (`D-20`); cada mudança avisa as outras partes (`meeting_link_changed`).

**R-REQ-07 — quem vê um pedido.** Dono: `auth_helper.can_view_request`.
- O criador; todos os membros activos da organização do pedido; a equipa.
- Um intérprete com linha em `request_assignments` desse pedido (convidado, candidato, atribuído).
- Pedidos abertos: os intérpretes elegíveis (`R-DIR-09`), pela vista `booking.open_requests_for_me`.
- **Beneficiário, morada exacta e notas** (`D-16`, `D-95`): só criador, organização, intérpretes **aceites** e equipa; os outros intérpretes veem a cidade. Dono: vista `booking.request_details`.

**R-REQ-08 — chat do pedido.** Um fio por par solicitante–intérprete (criado quando a atribuição nasce) e, no gerido, um fio solicitante–equipa. Dono: `booking.ensure_thread`. Participantes: o criador e os `owner`/`admin` da organização, o intérprete da atribuição, e a equipa no fio do gerido. O fio fecha `chat_close_days` depois de o pedido chegar a um estado final (`booking.close_threads`); fechado, lê-se mas não se escreve. Leituras da equipa: `R-PRIV-05`.

**R-REQ-09 — seguir com menos intérpretes.** Antes de estar `confirmed`, o solicitante pode baixar `interpreters_needed` até ao número de aceites (`CANNOT_REDUCE_BELOW_ACCEPTED`), o que confirma o pedido se ficar completo. Os convites e candidaturas pendentes que sobram passam a `cancelled`. No gerido com intenção viva por pagar, a intenção é cancelada e nasce outra com o valor novo; com intenção já `confirmed`, cria-se o reembolso dos lugares retirados (`managed_reduce`, `D-91`). Dono: `booking.reduce_interpreters_needed`.

**R-REQ-10 — pedido incompleto à hora.** A `staffing_warning_hours` do início, se faltarem intérpretes, avisa o solicitante (no gerido, a equipa), com as opções "Convidar mais" e "Seguir com {N}". À hora de início, se ainda faltarem, o pedido passa a `expired`: as atribuições aceites passam a `cancelled` com `cancelled_by_role = 'system'` e **sem** cancelamento tardio para ninguém; todos são avisados. Dono: `booking.warn_understaffed` e `booking.expire_unstaffed_requests`.

**R-REQ-11 — registo de transições.** Cada mudança de estado de um pedido ou de uma atribuição grava uma linha em `booking.request_events` e uma em `audit.events`, pela função que a fez (`booking.log_event`). O detalhe do pedido mostra este registo como linha do tempo.

---

## Ecrãs

### `requester-web` — `/requests/new` (assistente)

Mantém os 7 passos de hoje (`NewRequest.tsx`), agora ligados à base:

1. **Tipo**: "Escolher um intérprete" (directo), "Publicar para intérpretes" (aberto, com a escolha do modo) ou "Pedir à plataforma" (gerido). Em contexto de organização, um `member` vê no gerido: "Vai precisar de aprovação de um responsável." Espaço para vídeo LGA (`D-83`).
2. **Serviço e línguas** (e, no directo, o intérprete: lista de elegíveis, ou o que veio do perfil).
3. **Modalidade.**
4. **Data, hora e duração**, em hora de Luanda, com a indicação de urgência se for o caso. Acima de `two_interpreters_suggest_minutes`: "Serviços longos costumam precisar de dois intérpretes a revezar" e o campo "Quantos intérpretes".
5. **Local ou link**, e "Para quem é o serviço" (opcional).
6. **Orçamento** (só no aberto "o primeiro que aceitar"): valor por intérprete.
7. **Revisão**: tudo o que foi escolhido, e o **total** por intérprete e geral vindo de `booking.preview_request_total`, com a deslocação separada (`D-17`). No gerido: "O preço final é confirmado pela equipa." Fora da disponibilidade de um intérprete escolhido: aviso (`R-DIR-08`). Botão "Enviar pedido".

Cada passo valida no campo, com as mensagens do catálogo. Um erro da API ao enviar volta ao passo do campo em causa. **Nunca** mostra sucesso sem a resposta `201`.

### `requester-web` — `/requests`, `/history`

Lista paginada no servidor dos pedidos activos (`/requests`) e terminados (`/history`): código, serviço, data, tipo, estado (com `StatusBadge` do vocabulário único, `BookingStatus` gerado da base), intérpretes aceites/necessários, urgente. Filtros por estado e tipo. Em organização: filtro "Criados por mim / Toda a organização". **Vazio:** "Ainda não fizeste nenhum pedido" com "Fazer um pedido".

### `requester-web` e `interpreter-web` — `/requests/:id`

Cabeçalho com código, estado e próximos passos. Dados do serviço. Lista de intérpretes com o estado de cada atribuição e o preço (proposto ou acordado). Chat por intérprete (e, no gerido, com a equipa), com as propostas de preço no meio das mensagens (`negotiation.md`). Linha do tempo (`R-REQ-11`). As acções disponíveis dependem do estado e de quem vê (cada spec de tipo e de ciclo lista as suas). **Pedido que não existe ou que não se pode ver:** "Não encontrámos este pedido."

### `admin-web` — `/requests`, `/requests/:id`

Todos os pedidos, com filtros por tipo, estado, urgente, organização, período. O detalhe mostra tudo, incluindo os fios de chat (leitura pela API, `R-PRIV-05`) e as acções da equipa (cancelar, resolver disputas, atribuir no gerido).

---

## Casos-limite

- **Fuso horário:** a hora escolhida no ecrã é hora de Luanda; o ecrã converte para UTC ao enviar e de volta ao mostrar, com `packages/i18n`. Um intérprete noutro fuso vê também a hora de Luanda, marcada "(hora de Luanda)".
- **Pedido para daqui a 20 minutos:** recusado (`START_TOO_SOON`), com o mínimo na mensagem.
- **Duas pessoas da mesma organização a reduzir e a convidar ao mesmo tempo:** as funções fecham a linha do pedido (`FOR UPDATE`); a segunda vê o estado já mudado e falha com `STATE_CHANGED` se a acção deixar de fazer sentido.
- **Configuração ou preço do intérprete muda entre a revisão e o envio:** o total é recalculado no servidor ao criar e comparado com `expected_total_aoa`; se mudou, a API devolve `PRICE_CHANGED` e o ecrã volta à revisão com o novo total.
- **O serviço é desactivado depois de o pedido existir:** o pedido continua; só não se criam pedidos novos.

---

## Critérios de aceitação

1. Os sete casos de `R-REQ-01` falham cada um com o seu código e o seu campo (sete testes de integração).
2. `catalog.quote_service`: 45 minutos à hora com mínimo 60 e arredondamento 30 cobra 60 minutos; 75 minutos cobra 90; fixo ignora a duração; o resultado arredonda para cima ao kwanza (testes de casos-limite em SQL).
3. `grep` no código das apps: nenhuma multiplicação nem soma de preços fora da camada de dados que chama `preview_request_total`; `verify.py` tem a verificação correspondente.
4. Com margem de 30 minutos: um serviço que começa 20 minutos depois do fim de outro aceite falha com `SCHEDULE_OVERLAP`; um que começa 45 minutos depois passa.
5. Mudar a hora de um pedido com um intérprete aceite falha na base.
6. Um intérprete candidato não vê o beneficiário; depois de aceite, vê.
7. Um pedido com 1 de 2 intérpretes à hora de início fica `expired`, o intérprete aceite é avisado, e ninguém tem cancelamento tardio.
8. O estado do pedido só é escrito por `refresh_request_status` e pelas transições explícitas de `data-model.md` §5 (verificação por `grep` em `packages/db/functions`).
