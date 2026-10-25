# Regras de execução — modo contínuo

> Para o Claude Code. **Ler no início de cada sessão e reler sempre que a sessão for resumida automaticamente**, em vez de confiar no resumo. Este ficheiro manda sobre o resto em caso de conflito sobre *como* se trabalha; `decisions.md` manda sobre *o que* o produto faz.

---

## 1. O que não dobra

Se um passo exigir alguma destas coisas, **salta-se esse passo** (ou a parte dele), regista-se em `docs/plan/auto-decisions.md` com `[BLOQUEIO]`, e segue-se para o passo seguinte que não dependa dele.

1. **Nada em produção.** Nenhuma escrita em bases, serviços ou contas que não sejam locais. O projecto Supabase remoto antigo (`mfobqukllkxuimcjiqvn`) **não se toca**, nem para ler.
2. **Segredos.** Nunca ler, imprimir, `cat`, `grep` ou `echo` o `.env`, ficheiros de credenciais ou de contas de teste. Os nomes das variáveis vêm de `.env.example` e de `apps/api/src/config/env.ts`. Para correr algo que precise do ambiente, carrega-se sem o mostrar.
3. **Nada se instala no sistema da máquina sem perguntar.** As dependências do projecto, por pnpm, são permitidas, e cada uma é justificada na mensagem do commit. A CLI do Supabase é dependência de desenvolvimento do projecto, não do sistema.
4. **O repositório nunca é tornado público.**
5. **Depois do recomeço do Git (passo B), nunca se reescreve história:** sem `push --force`, sem `--force-with-lease`, sem `rebase` nem `--amend` de commits já enviados, sem `reset --hard` sobre trabalho enviado. Um erro corrige-se com um commit novo.
6. **A base de dados muda só por ficheiros do repositório** (`packages/db/`), aplicados pelos scripts. Nunca `execute_sql` com escrita nem `apply_migration` por conector ou MCP. **Uma migration aplicada é imutável**; a correcção é uma migration nova.
7. **Nas decisões pendentes do cliente, usa-se o comportamento provisório de `decisions.md` §10**, e não se inventa outro.
8. **Valores legais nunca se inventam**: textos legais, taxas de imposto, NIFs, IBANs reais. Ficam vazios e entram na lista do que bloqueia a produção.
9. **Nunca se faz merge para `main`.** Trabalha-se em `dev`.

## 2. Nunca pára

Não há paragens para perguntar nada ao Rafael. **Termina um passo e começa o seguinte na mesma resposta.** Acabar uma resposta a dizer "sigo para o próximo passo" conta como parar.

A execução só termina quando:
- todos os passos do `MASTER-PLAN.md` estão fechados, ou
- tudo o que resta está bloqueado pelo §1.

E então escreve o relatório final (§8).

## 3. Quando a documentação não cobre

Por esta ordem:

1. **Escolher a opção reversível** que protege os dados das pessoas e o dinheiro já pago, e que não cobra mais a ninguém.
2. **Se for um valor** (preço, prazo, percentagem, mínimo, limite), torná-lo configurável: coluna nova em `config.platform_versions`, por migration nova, com o valor provisório no seed.
3. **Nunca inventar valores legais** (§1.8).
4. **Registar em `docs/plan/auto-decisions.md`**, com este formato:

```markdown
## AD-NNN — título curto
- **Passo:** H7 (pedido aberto)
- **Contexto:** o que a documentação não cobria, com o ficheiro e a secção.
- **Opções:** A) … B) … C) …
- **Escolha:** B
- **Porquê:** …
- **Como se desfaz:** …
- **Marcas:** [RISCO] se mexe em dinheiro, dados pessoais ou visibilidade; [BLOQUEIO] se impede um passo.
```

Se um passo parecer mal pedido, regista-se a objecção em `auto-decisions.md` e faz-se **a versão mais segura dele**. Não se pára por isso.

Se o código actual divergir do que a documentação supõe, **segue-se a intenção da documentação** e regista-se a divergência.

`decisions.md` **nunca se edita** durante a execução. Uma decisão nova vai sempre para `auto-decisions.md`.

## 4. No início de cada sessão

1. Ler este ficheiro, `docs/plan/MASTER-PLAN.md` e `HANDOFF.md`.
2. Confirmar o estado real: `git status`, `git log -5 --oneline`, a última tag, e `pnpm db:verify` se o último passo tocou em `packages/db/`. **Se o HANDOFF disser uma coisa e o repositório outra, vale o repositório**; regista-se a divergência.
3. Continuar a partir do próximo passo por fechar. Um passo a meio retoma-se do início do ciclo (§6, alínea a), aproveitando o que estiver commitado.

Se a sessão for **resumida automaticamente** a meio, relê os três ficheiros antes de continuar. Um resumo não é uma fonte: já apagou uma lista inteira de tarefas noutro projecto.

## 5. Base de dados local

O projecto Supabase remoto está pausado. Trabalha-se com o **Supabase local em Docker**, pela CLI do Supabase instalada como dependência de desenvolvimento do projecto (`pnpm exec supabase`).

- **Antes de arrancar:** verificar o disco livre. **Abaixo de 10 GB, não arranca**: escreve em português, no terminal e em `auto-decisions.md`, o comando de limpeza (`docker system df` para ver; `docker volume prune` e `docker image prune` para limpar), e salta o que precisar da base.
- **Dois tipos de instância.**
  - **Temporária** — `db:verify`, os testes da base e `reset-local.sh`: arranca, faz o trabalho e apaga contentores e volumes no fim, incluindo quando falha ou é interrompida. Estes scripts, e só estes, têm no topo:

```bash
cleanup() { pnpm exec supabase stop --no-backup >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM
```

  - **De desenvolvimento** — `pnpm db:up` / `pnpm db:down`: fica de pé enquanto se trabalha nos ecrãs e nos testes Playwright, **sem** `trap`. Pára-se com `db:down` no fim de cada passo e no fim da sessão, e antes de qualquer instância temporária.
  A imagem pode ficar (descarregá-la outra vez custa tempo e rede).
- **Uma só instância de cada vez.** Antes de arrancar, parar qualquer instância do projecto que tenha ficado.
- **Se a estrutura da base não existir em ficheiros no repositório**, reconstrói-se a partir de `data-model.md` e das specs, e regista-se o que teve de ser suposto.
- **O relógio nos testes:** as regras com prazos testam-se com uma função de tempo substituível nos testes (`util.now()` a envolver `now()`, que os testes podem fixar), nunca com esperas reais.

## 6. O ciclo de cada passo

**a) Reler a spec do passo**, e as secções de `data-model.md` e `api.md` que ela cita.

**b) Melhorar a spec antes de implementar.** Usar a skill `brainstorming` do plugin Superpowers. Atenção: essa skill foi feita para perguntar ao utilizador e esperar. **Aqui não se espera**: o Claude Code responde ele próprio às perguntas da skill com as regras do §3, e escreve no fim da spec uma secção "Melhorias da execução" com o que mudou e porquê (sem mudar decisões; o que contrariar `decisions.md` vai para `auto-decisions.md`). Depois, a skill `writing-plans` para o plano de implementação do passo, guardado em `docs/plan/step-plans/<passo>.md`. Se o plugin não estiver instalado, regista-se e segue-se sem ele, escrevendo o plano à mão no mesmo ficheiro.

**c) Implementar**, por esta ordem dentro do passo: migration → funções → políticas e concessões → seed → asserções SQL → rotas da API e testes → DAOs, UseCases e ViewModels (skill `clean-architecture-mvvm-data-layer`) → ecrãs, com estados vazio, a carregar e de erro → apagar os mocks substituídos.

**d) Passar os portões:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `python3 scripts/verify.py`, `pnpm db:verify`, e o fluxo do passo em Playwright com capturas em `docs/plan/evidence/<passo>/`.
**Cada teste de comportamento novo corre-se também contra o commit anterior e tem de falhar lá.** Se passar no commit anterior, não está a testar a regra: reescreve-se. Regista-se no relatório o resultado das duas corridas. As **verificações estruturais** (`verify.py`, `grep`) provam-se de outra forma: um ficheiro de violação deliberada em `scripts/fixtures/` que a verificação tem de apanhar (`MASTER-PLAN.md`, portão 2).

**e) Revisão independente.** Lançar um subagente que **não escreveu o código**, com a spec do passo, o diff do passo (`git diff <tag anterior>..HEAD`) e este pedido:

> Revê este diff contra a spec. Procura, com ficheiro e linha: divergências da spec; falhas silenciosas (um erro que o ecrã apresenta como sucesso); buracos de permissões, na API e na base (RLS, concessões, funções `SECURITY DEFINER` sem verificação de quem chama); dinheiro (duplicados, concorrência, arredondamentos, imposto somado no ecrã); erros que não chegam ao ecrã em português e no campo certo; estados vazios, a carregar e de erro em falta; testes em falta para regras `R-…`; a mesma regra escrita em dois sítios. Classifica cada achado como CONFIRMADO (mostras o caminho que falha) ou PLAUSÍVEL. Não proponhas reescritas do que está certo.

Corrigir o que for CONFIRMADO e repetir a alínea d). Os PLAUSÍVEIS verificam-se: confirmados corrigem-se; não confirmados registam-se no relatório do passo. **Quando se corrige uma regra escrita em dois sítios, acrescenta-se a `verify.py` uma verificação que recuse a próxima repetição.**

**f) Fechar o passo:**
1. versão nova em todos os `package.json` (uma só versão para o monorepo), pela tabela do `MASTER-PLAN.md`;
2. entrada no `CHANGELOG.md`;
3. `HANDOFF.md` actualizado (§10);
4. linha nova em `docs/plan/run-log.md` (§10);
5. commit e tag anotada (`git tag -a vX.Y.Z -F <ficheiro>`), com o passo, a data e o estado medido no corpo da tag (testes, verificações, migrations);
6. push de `dev` e da tag, **se já houver remoto**.

**Um passo por versão, nunca vários juntos**: se a sessão cair, a seguinte continua do último passo fechado.

## 7. Git

- **Recomeço:** `specs/foundation.md` §B.
- **Ramos:** `main` (nunca se toca nesta corrida) e `dev` (todo o trabalho).
- **Commits:** em `dev`, frequentes dentro de um passo, sempre com os portões rápidos (`lint`, `typecheck`) a passar. **Mensagens em inglês** (`D-84`), Conventional Commits (`feat(booking): …`, `fix(billing): …`), corpo com o porquê. **Mensagem sempre por ficheiro** (`git commit -F <ficheiro>`), nunca `-m` com texto que o shell interprete. **Sem a linha `Co-Authored-By`.** Adicionar só os ficheiros tocados; nunca `git add -A` sem rever `git status`.
- **Push:** começa quando o Rafael der o endereço do repositório novo (vem em `HANDOFF.md` ou na mensagem da sessão). Até lá, continua-se só com commits locais. **Não ter remoto não é motivo para parar.** Quando o remoto aparecer, `git remote add origin <url>`, `git push -u origin dev` e `git push origin --tags`.
- **Hook `pre-push`:** corre `lint`, `typecheck`, `test`, `verify.py`, e `db:verify` se o push toca em `packages/db/`. `--no-verify` só em emergência, e dito na mensagem do commit.

## 8. O relatório final — `docs/plan/run-report.md`

É para o Claude que desenha com o Rafael, não para o Rafael: **traz provas, não afirmações.**

1. **Uma linha por cada passo do `MASTER-PLAN.md`:** feito (com a versão e a prova) ou não feito (com o porquê).
2. **Por passo feito:** o que mudou, em 3 a 5 linhas; a prova (os testes novos e o resultado contra o commit anterior: falhou lá, passa aqui); o que o revisor apanhou e o que foi corrigido; o que não foi verificado e porquê.
3. **Todas as auto-decisões**, com `[RISCO]` nas que mexem em dinheiro, dados pessoais ou visibilidade.
4. **As dúvidas do Claude Code:** o que pode estar errado mesmo com os testes verdes.
5. **Estado final comparado com o início:** versão, número de testes por pacote, verificações do `verify.py`, número de migrations, tabelas, políticas, funções (contados na base aplicada, nunca por texto).
6. **Em secção separada, para o Rafael:** os testes no ecrã, agrupados por app, com o passo exacto e o resultado esperado (o mesmo conteúdo de `docs/testing/MANUAL-TEST-PLAN.md`, resumido), e as contas de teste por papel (os emails; as palavras-passe ficam em `docs/technical/TEST-CREDENTIALS.md`, que está no `.gitignore`).

"Todos os testes passaram" não é prova. Cola-se a saída em bruto do resumo de cada comando.

## 9. Convenções do código

- **Língua** (`D-84`): identificadores, comentários, descrições de testes e commits em inglês; português só no que o utilizador vê (em `packages/i18n` e nos modelos de email) e na documentação.
- **Uma regra, um sítio.** Cada regra `R-…` tem o dono indicado em `data-model.md`. Antes de escrever lógica de negócio em TypeScript, verificar se ela já existe numa função SQL; se existe, chama-se, não se copia. A única excepção autorizada é `R-CFG-05`.
- **Preços e totais** vêm sempre da base (`catalog.quote_service`, `booking.preview_request_total`, `billing.split_amount`). Nenhum ecrã soma, multiplica ou aplica percentagens a dinheiro.
- **Erros:** o catálogo de `api.md` §2, um sítio só (`apps/api/src/lib/`). A app decide pelo `code`. Nenhum texto técnico da base chega ao ecrã.
- **Nada falha em silêncio.** Toda a escrita verifica o erro. Um ecrã nunca mostra sucesso sem a resposta de sucesso. Estados intermédios dizem-se como são ("Comprovativo em análise"), nunca como se tivessem acabado.
- **Datas:** guardadas em UTC; mostradas e calculadas em hora de Luanda (`packages/i18n` e `util.app_timezone()`).
- **Sem optimistic update** em estados de pedidos ou dinheiro.
- **Listas do admin** paginadas no servidor (`R-ADM-06`).
- **TypeScript estrito**; `as any` e `@ts-ignore` só com comentário a explicar e registo em `auto-decisions.md`.

## 10. `HANDOFF.md` e `run-log.md`

**`HANDOFF.md`** (raiz) — reescrito no fim de cada passo, curto:

```markdown
# HANDOFF
- Versão: v0.14.0 (H5 fechado em AAAA-MM-DD)
- Próximo passo: H6 — negociação (docs/plan/specs/negotiation.md)
- Remoto: <url ou "ainda não há">
- Estado: testes N verdes; verify.py N/N; migrations N; db:verify verde
- Em aberto neste momento: <nada, ou o que ficou a meio e onde>
- Auto-decisões novas neste passo: AD-0xx, AD-0yy
- Bloqueios: <lista, ou nenhum>
```

**`docs/plan/run-log.md`** — uma linha acrescentada por passo, nunca reescrita: data, passo, versão, testes, o que o revisor apanhou, auto-decisões.

## 11. Mensagens que ninguém vai ler a tempo

O Rafael não está a ver. Uma pergunta escrita no terminal não tem resposta. Por isso, nada se pergunta: decide-se pelo §3 e regista-se. A única excepção é o disco abaixo de 10 GB (§5), que se escreve no terminal **e** em `auto-decisions.md`, e mesmo aí não se espera: segue-se para o que não precisa da base.
