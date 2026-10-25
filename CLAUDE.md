# Portal dos Intérpretes

Plataforma da Academia Grace Mind que junta quem precisa de um intérprete com quem o pode fazer — Língua Gestual Angolana em primeiro lugar, também línguas faladas. O intérprete tem perfil, serviços, preços e avaliações; quem precisa encontra, pede, combina o preço e marca.

**`docs/_source/product-explainer.md` descreve o produto; as decisões estão em `docs/plan/decisions.md` (códigos `D-xx`) e as regras em `docs/plan/specs/` (códigos `R-…`).** As perguntas P1–P14 do §8 do explainer já foram decididas em `decisions.md` (2026-10-18); as pendentes do cliente estão em `decisions.md` §10, com o comportamento provisório.

**Modo contínuo (desde 2026-10-25):** a execução segue `docs/plan/MASTER-PLAN.md` com as regras de `docs/plan/claude-code-rules.md`. Esse ficheiro manda sobre *como* se trabalha; `decisions.md` manda sobre *o que* o produto faz. O estado da corrida está em `HANDOFF.md` e `docs/plan/run-log.md`.

---

## Estado actual

Monorepo pnpm + Turborepo desde o passo C; os ecrãs da SPA antiga foram movidos para as quatro apps nos passos D1–D4 e a SPA antiga foi apagada (fica no git até `aca929a`). O estado da corrida está em `HANDOFF.md`; o que mudou, passo a passo, em `CHANGELOG.md` e `docs/plan/step-reports/`.

- **Os ecrãs ainda mostram mocks.** Cada passo H liga os seus ecrãs à base nova e apaga os mocks que substitui. Até lá há avisos de sucesso sem nada por trás (AD-014, AD-016).
- **Sem autenticação ligada** até ao H1 (equipa) e H2 (contas); as rotas não têm guardas até lá.
- **Zero migrations** até ao passo F; a base nova constrói-se **só localmente**, por ficheiros em `packages/db/` (ADR-004 (schema recomeçado de raiz)). O projecto Supabase remoto antigo não se toca.
- O inventário da SPA de partida (2026-10-15) continua em `docs/inventory/` (00–05) como referência histórica.

---

## INVIOLÁVEL — nenhuma escrita na base remota

**Nenhuma escrita na base de dados remota, por caminho nenhum.** Inclui:

- `execute_sql` com qualquer instrução que não seja `SELECT`
- `apply_migration`
- escrita pelo painel do Supabase
- qualquer outro conector, script ou via indirecta

**Leitura:** só por MCP em modo `read_only` com `project_ref` fixo —
`https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true`.
Sem isso, não há leitura do remoto.

Quando o schema voltar a mudar: **só por ficheiros do repositório**, aplicados pelo processo documentado. Uma migration é imutável depois de aplicada — a correcção é uma migration nova. Cada migration abre com `BEGIN` e fecha com `COMMIT`: sem isso, um erro a meio deixa metade aplicada, e metade aplicada parece aplicada.

---

## Segredos e máquina

- **Nunca ler, imprimir ou fazer `grep` ao `.env`**, nem a ficheiros de credenciais. Nomes de variáveis, sim; valores, nunca.
- **Nunca instalar nada na máquina sem perguntar.**
- O que toca produção ou leva segredos: eu escrevo o script, o Rafael corre-o, eu leio o resultado.

---

## Git

As regras de Git são as de `docs/plan/claude-code-rules.md` §7 (decisão do Rafael, 2026-10-25, ao ligar o modo contínuo).

**Posso, sem pedir:**
- `commit` em `dev`, **sem linha `Co-Authored-By`**, mensagem em inglês (Conventional Commits)
- mensagem **por ficheiro** (`git commit -F`), nunca `-m` com texto que o shell interprete — backticks, `$` e `!` executam antes de o git os ver
- adicionar **só os ficheiros que toquei**, revendo `git status`; nunca `git add -A` às cegas
- `push` de `dev` para `origin` (https://github.com/RafaelPilartes/monorepo-portal_dos_interprete-ts), e das tags de versão

**Nunca:**
- `merge` para `main`
- reescrever história já enviada: `--amend` depois do push, `rebase`, `reset --hard`, `push --force`, **incluindo `--force-with-lease`**
- qualquer escrita em produção

O rollback fica escrito antes de qualquer deploy.

---

## Língua

**Uma fronteira só: tudo o que está no código em inglês, só o que o utilizador vê em português** (decisão L1, 2026-10-15).

- **Inglês:** identificadores — variáveis, funções, tipos, ficheiros, pastas, colunas, valores de enum, chaves de resposta da API — e também **comentários, descrições de testes e mensagens de commit**.
- **Português:** só o que o utilizador lê — ecrãs, notificações, mensagens de erro.
- Erros com dois níveis: um `code` estável em inglês e, nos erros de negócio, mensagem em português **no campo certo**. A app decide pelo `code`, nunca pela mensagem, e nunca mostra texto técnico da base.

---

## Como reportar

- **Marcar cada afirmação:** `[VISTO]` (li no código ou no schema — com `ficheiro:linha`), `[INFERIDO]` (deduzi), `[DESCONHECIDO]` (não verifiquei).
- **Cada código citado leva entre parêntesis o que é, em cada menção** — não só na primeira: `P4 (dinheiro)`, `item 6 (zero guards de rota)`, `D5 (colunas que o código espera)`.
- **Uma consulta que devolve zero resultados é inconclusiva, não "passou".** Vale como ausência de prova, nunca como prova de ausência.
- Separar o que **bloqueia** (tem evidência de dano e impede o uso real) do que é **melhoria**. Sem exagero.
- Apontar incoerências em vez de as resolver em silêncio — na arquitectura, na UI, ou numa instrução que não bata certo.
- Nada falha em silêncio: toda a escrita verifica o erro, e o ecrã diz a verdade sobre o estado, sem fingir que acabou.

---

## Nunca inventar

**Nenhuma regra de negócio, preço ou fluxo que não esteja em `docs/plan/decisions.md`, `docs/plan/specs/` ou `docs/_source/product-explainer.md`.**

No modo contínuo não se pára para perguntar: o que a documentação não cobre decide-se pela opção reversível mais segura e regista-se em `docs/plan/auto-decisions.md` (`claude-code-rules.md` §3). Pendentes do cliente usam o comportamento provisório de `decisions.md` §10. Valores legais (textos legais, impostos, NIF, IBAN reais) nunca se inventam.

---

## Início e fim de tarefa

- **No início de cada sessão:** ler `docs/plan/claude-code-rules.md`, `docs/plan/MASTER-PLAN.md` e `HANDOFF.md`; confirmar o estado real com `git status`, `git log -5 --oneline` e a última tag.
- **No fim de cada passo:** reescrever `HANDOFF.md` (formato de `claude-code-rules.md` §10) e acrescentar uma linha a `docs/plan/run-log.md`.

---

## Onde está o resto

| Documento | O que tem |
|---|---|
| `docs/plan/MASTER-PLAN.md` | a ordem de execução, passo a passo (A–G, H1–H19, Z) |
| `docs/plan/claude-code-rules.md` | como se trabalha no modo contínuo |
| `docs/plan/decisions.md` | as decisões `D-xx` (fonte das decisões) |
| `docs/plan/specs/` | as regras `R-…` por funcionalidade |
| `docs/plan/architecture.md`, `data-model.md`, `api.md` | arquitectura, modelo de dados, API |
| `docs/plan/auto-decisions.md` | decisões tomadas durante a execução (`AD-NNN`) |
| `docs/plan/environment.md` | o que a VM da sessão permite (Docker, rede, tags) |
| `docs/_source/product-explainer.md` | o que o produto deve fazer; §8 aponta para `decisions.md` |
| `docs/_source/working-with-rafael.md` | como trabalhamos: fases completas, quem faz o quê, convenções, git |
| `docs/inventory/00-overview.md` | repo, stack, git, Supabase, auth, deploy |
| `docs/inventory/01-database.md` | schema local tabela a tabela, diagrama ER, schema esperado pelo código |
| `docs/inventory/02-screens.md` | 68 páginas, 61 rotas, dados, formulários, estados |
| `docs/inventory/03-flows.md` | papéis, jornadas, máquinas de estado |
| `docs/inventory/04-gaps.md` | lacunas numeradas com evidência e gravidade + dúvidas D1–D13 |
| `docs/inventory/05-route-map.md` | cada página antiga e a app nova a que pertence |
| `docs/inventory/handoff-2026-10-16.md` | o HANDOFF do inventário, arquivado |
| `HANDOFF.md` | estado da corrida e próximo passo |

`docs/decisions/` guarda os ADR (`ADR-001`…`ADR-007`, criados no passo C). As decisões de produto estão em `docs/plan/decisions.md`.
