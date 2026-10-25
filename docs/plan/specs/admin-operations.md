# Spec — Operações da equipa (passo H13)

> O que a equipa precisa de ver e fazer que não está noutras specs: painel inicial, filas, relatórios, exportações, conteúdo do site. A matriz de permissões está em `staff-and-config.md` (`R-STF-01`). Decisões: `D-60` a `D-62`, `D-83`.

---

## Regras

**R-ADM-01 — permissões.** Todas as rotas e ecrãs desta spec respeitam `R-STF-01`. Um ecrã a que o nível não tem acesso não aparece no menu; aberto por URL, mostra "Não tens acesso a esta área."

**R-ADM-02 — relatórios.** Funções `analytics.*` na base (schema `analytics`, criado neste passo, só funções e vistas), chamadas por `GET /admin/reports/:name`:
- `overview`: pedidos criados, confirmados, concluídos, cancelados (com tardios à parte), expirados; por tipo; intérpretes novos, listados, verificados; solicitantes e organizações novos.
- `requests`: tempo até ao primeiro aceite, taxa de expiração, serviços e línguas mais pedidos, cidades.
- `payments`: recebido por contexto, reembolsado, repasses pagos e em fila, comprovativos por tratar e tempo médio de validação.
- `verifications`: submetidas, aprovadas, recusadas, com correcções, tempo médio de decisão, selos a expirar nos próximos 30 dias.
Quem vê cada relatório: a matriz de `R-STF-01` (no `request_operator`, o relatório `requests` filtra só os geridos, na própria função). Cada relatório compara com o **período anterior do mesmo tamanho**, calculado na base. **Um período sem dados devolve listas vazias e `null`, nunca zeros inventados**; o ecrã escreve "Não houve {pedidos} neste período". Zero só aparece quando é uma medição (por exemplo, "0 pedidos expirados" num período com pedidos).

**R-ADM-03 — exportações.** Só `super_admin` e `finance` (`D-61`). Conjuntos: `requests`, `payments`, `refunds`, `payouts`, `verifications`, `accounts` (sem contactos). **Nenhuma exportação leva documentos, conversas, beneficiários nem dados bancários completos** (o IBAN sai mascarado: `AO06 **** **** 1234`). Cada exportação fica na auditoria com o conjunto, os filtros e o número de linhas. Um período sem dados exporta o cabeçalho e uma linha "sem movimento no período". Acima de 100 000 linhas, a exportação é recusada com `EXPORT_TOO_LARGE` (a contagem é feita antes de gerar, e o ecrã mostra-a na pré-visualização).

**R-ADM-04 — conteúdo do site.** Testemunhos (submetidos por qualquer conta, `POST /testimonials`, entram `pending`; a equipa aprova, recusa e destaca), casos de sucesso, tutoriais em vídeo e os espaços de vídeo LGA (`D-83`, uma chave por página ou passo: `home`, `how_it_works`, `for_requesters`, `for_interpreters`, `request_step_1` a `request_step_7`, `verification`). O site lê só o que está aprovado ou publicado. Um espaço LGA vazio não aparece.

**R-ADM-05 — supervisão de pedidos.** A equipa vê todos os pedidos e age conforme a matriz: cancelar (nunca tardio, `R-LIFE-01`), resolver disputas (`R-LIFE-06`), atribuir no gerido (`R-MAN-04`), ler conversas (`R-PRIV-05`).

**R-ADM-06 — filas.** Toda a lista do admin é paginada **no servidor**, com `limit`, `offset`, `q`, `sort`, `state`. Sem `state`, mostra a **fila de trabalho** (o que espera por alguém); com `state=all`, o histórico. Cada linha decidida mostra **quem decidiu e quando**. Os contadores do menu lateral dizem quantos itens **há** na fila (contados na base), não quantos chegaram à página.

---

## Ecrãs (`admin-web`)

- **`/` (painel):** números do dia e da semana (`overview`), e as filas com contador: geridos por tratar, comprovativos, verificações, disputas abertas, denúncias, tickets, emails falhados, repasses em fila. Cada contador leva à fila.
- **`/reports`:** um separador por relatório, com escolha de período (presets: 7 dias, 30 dias, trimestre, personalizado), gráficos e a comparação com o período anterior. **Vazio:** a frase de `R-ADM-02`.
- **`/exports`:** escolher conjunto e período, pré-visualizar o número de linhas, descarregar.
- **`/content/testimonials`, `/content/success-cases`, `/content/tutorials`, `/content/lga-videos`:** listas com estados e acções; os vídeos LGA por chave, com a pré-visualização.
- **`/content/reports`:** a fila de denúncias (`community-forum-feed.md`).
- **Estados:** em todas as listas, esqueleto a carregar, frase de vazio própria da fila ("Não há comprovativos por tratar"), erro com "Tentar outra vez".

---

## Casos-limite

- **Um `finance` abre `/verifications` por URL:** "Não tens acesso a esta área."; a API devolve `FORBIDDEN` a qualquer chamada.
- **Exportar um período de 3 anos:** permitido, em streaming; acima de 100 000 linhas, a API pede um período mais curto.
- **Relatório num período que começa antes do primeiro pedido:** o período anterior não tem dados; a comparação mostra "Sem período anterior para comparar".

---

## Critérios de aceitação

1. Um `moderator` não vê "Exportações" no menu e recebe `403` na rota.
2. Exportar `payouts` devolve o IBAN mascarado e cria uma entrada na auditoria com o número de linhas.
3. O relatório `payments` de um período sem pagamentos devolve listas vazias, e o ecrã mostra a frase, não zeros.
4. A fila de comprovativos sem `state` mostra só os pendentes; com `state=all`, também os decididos, com quem e quando.
5. O contador lateral da fila bate com a contagem na base, com mais itens do que cabem numa página.
