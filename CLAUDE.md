# Portal dos Intérpretes

Plataforma da Academia Grace Mind que junta quem precisa de um intérprete com quem o pode fazer — Língua Gestual Angolana em primeiro lugar, também línguas faladas. O intérprete tem perfil, serviços, preços e avaliações; quem precisa encontra, pede, combina o preço e marca.

**`docs/_source/product-explainer.md` é a fonte de verdade do produto.** Quando o código e esse documento discordarem, ou o código tem um defeito, ou há uma decisão a tomar — e a decisão fica registada, nunca assumida. As perguntas em aberto estão no §8 desse documento, com códigos P1–P14.

---

## Estado actual

Inventário completo em `docs/inventory/` (00–04). Em factos curtos:

- **SPA única vinda do Lovable** — Vite 5 + React 18 + TS + shadcn/ui. Sem backend, sem API, sem edge functions. `00-overview.md` §§1–2
- **Sem autenticação ligada.** A cadeia Supabase existe (`SupabaseAuthDAO` → `AuthUseCase` → `auth.viewmodel`) e `auth.viewmodel.ts` não é importado por ficheiro nenhum. O login é `setTimeout` + toast. `00-overview.md` §5, `04-gaps.md` item 5 (autenticação não ligada)
- **Sem guards de rota.** `/dashboard/admin` abre a qualquer visitante. O papel escolhe-se escrevendo o URL. `04-gaps.md` item 6 (zero guards de rota)
- **Zero migrations.** Não há `supabase/migrations/` nem `config.toml`; o schema vive em 3 `.sql` soltos, e o principal nunca correu com sucesso de uma só vez. `01-database.md` §6, `04-gaps.md` itens 3 (zero migrations) e 4 (o `.sql` não corre de uma só vez)
- **Projecto Supabase remoto inacessível** à data de 2026-10-15 (ref em `VITE_SUPABASE_URL`). O conector não tem permissão sobre ele. `00-overview.md` §9
- **Estado do RLS desconhecido**, com a `anon key` no bundle do browser. Localmente: 0 RLS e 0 policies em 37 tabelas. `01-database.md` §10, `04-gaps.md` item 2 (RLS desconhecido)
- **1 das 68 páginas usa dados reais** (`AdminTeam.tsx`). 38 DAOs, 37 usecases e 37 viewmodels construídos, quase nenhum consumido. `02-screens.md` §§0 e 8
- **Schema por decidir.** O modelo actual é um rascunho, com 18 divergências face ao que o código espera. `01-database.md` §5.2

**Nada se aplica à base de dados enquanto o modelo de domínio não estiver decidido.** P1 (empresa: uma conta ou uma equipa) e P4 (dinheiro) travam a montagem — `product-explainer.md` §8.

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

**Posso, sem pedir:**
- `commit`, **sem linha `Co-Authored-By`**
- mensagem **por ficheiro** (`git commit -F`), nunca `-m` com texto que o shell interprete — backticks, `$` e `!` executam antes de o git os ver
- adicionar **só os ficheiros que toquei**. Nunca `git add .` nem `git add -A`: há 182 ficheiros com diferenças de fim de linha (LF→CRLF) que não são para commitar

**Preciso de autorização, de cada vez:**
- `push`
- `merge` para `main`
- reescrever história já enviada: `--amend` depois do push, `rebase`, `reset`, `push --force`, **incluindo `--force-with-lease`**
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

**Nenhuma regra de negócio, preço ou fluxo que não esteja em `docs/_source/product-explainer.md` ou em `docs/decisions/`.**

O que não está escrito fica **"por confirmar"**, para o Rafael confirmar. Uma decisão de produto em falta é um ponto de paragem, não um palpite — e **nada que dependa de um item em aberto é implementado**.

---

## Início e fim de tarefa

- **No início de uma tarefa que continua trabalho anterior: ler `HANDOFF.md`.**
- **No fim de cada fase: actualizá-lo** — o que ficou feito, o que ficou em aberto, e o que o Rafael tem de ver no ecrã.

---

## Onde está o resto

| Documento | O que tem |
|---|---|
| `docs/_source/product-explainer.md` | o que o produto deve fazer (fonte de verdade) + P1–P14 em aberto |
| `docs/_source/working-with-rafael.md` | como trabalhamos: fases completas, quem faz o quê, convenções, git |
| `docs/inventory/00-overview.md` | repo, stack, git, Supabase, auth, deploy |
| `docs/inventory/01-database.md` | schema local tabela a tabela, diagrama ER, schema esperado pelo código |
| `docs/inventory/02-screens.md` | 68 páginas, 61 rotas, dados, formulários, estados |
| `docs/inventory/03-flows.md` | papéis, jornadas, máquinas de estado |
| `docs/inventory/04-gaps.md` | lacunas numeradas com evidência e gravidade + dúvidas D1–D13 |
| `HANDOFF.md` | estado da última sessão e próxima tarefa |

`docs/decisions/` ainda não existe. Quando a primeira decisão consequente for tomada, fica lá registada com o porquê.
