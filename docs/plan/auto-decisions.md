# Decisões automáticas — modo contínuo

> Decisões tomadas pelo Claude Code durante a execução, onde a documentação não cobria (`claude-code-rules.md` §3). Nenhuma muda `decisions.md`. Formato fixo; `[RISCO]` mexe em dinheiro, dados pessoais ou visibilidade; `[BLOQUEIO]` impede um passo ou parte dele.

---

## AD-001 — Passo B adaptado: o repositório já foi recomeçado
- **Passo:** B (Git do zero)
- **Contexto:** `specs/foundation.md` §B, alíneas 1–3, manda fazer `git bundle` do histórico antigo, apagar `.git` e `git init`. O repositório desta corrida (`RafaelPilartes/monorepo-portal_dos_interprete-ts`) já foi importado sem histórico: um só commit (`a93fde8 first commit`) em `main`, e `dev` criado a 2026-10-25 a partir dele (`docs/plan/environment.md` §3). O histórico antigo (`grace-mind-connect`) não está nesta máquina.
- **Opções:** A) apagar `.git` e recomeçar outra vez, perdendo a ligação ao remoto novo; B) manter o repositório como está, fazer só as alíneas 4–9, e deixar o bundle ao Rafael; C) parar.
- **Escolha:** B
- **Porquê:** o objectivo do passo (repositório novo, sem segredos, sem histórico antigo) já está cumprido; recomeçar outra vez não acrescenta nada e reescrevia história enviada (§1.5).
- **Como se desfaz:** nada a desfazer. O bundle faz-se na máquina do Rafael: `git -C <grace-mind-connect> bundle create ../grace-mind-connect-old-history.bundle --all`.
- **Marcas:** [BLOQUEIO] só da alínea 1 (bundle), que fica para o Rafael.

## AD-002 — Tags de versão: locais, com script para o Rafael as enviar
- **Passo:** todos (B a Z), `claude-code-rules.md` §6 f), alíneas 5–6
- **Contexto:** nesta VM o push de tags dá `HTTP 403` (`git push origin <tag>`), a criação pela API REST (`POST /git/tags`, `/git/refs`) dá "Write access to this GitHub API path is not permitted through this proxy", e as releases dão "not permitted for this session type" (2026-10-25). O push de branches funciona.
- **Opções:** A) não criar tags; B) criar a tag anotada localmente e registar cada uma em `scripts/release-tags.sh`, que recria as tags anotadas nos commits certos e as envia, para o Rafael correr na máquina dele; C) parar.
- **Escolha:** B
- **Porquê:** as tags locais perdem-se com o contentor; o script fica versionado em `dev` e reproduz exactamente o que a tag diria. Também se regista a versão no `CHANGELOG.md` e no `run-log.md`.
- **Como se desfaz:** apagar o script; as tags enviadas apagam-se com `git push origin :refs/tags/vX.Y.Z`.
- **Marcas:** —

## AD-003 — HANDOFF do inventário arquivado; CLAUDE.md passa ao modo contínuo
- **Passo:** antes de A
- **Contexto:** o `HANDOFF.md` de 2026-10-16 dizia que a próxima tarefa era "fechar P1 e P4", já decididas em `decisions.md` (D-01 (empresa = organização com membros), D-30 (pagamento de directos e abertos fora da plataforma)). O `CLAUDE.md` pedia autorização para cada push, apontava para `docs/decisions/` (que não existia) e mandava parar perante itens em aberto, ao contrário de `claude-code-rules.md` §§2–3.
- **Opções:** A) deixar como está e seguir; B) arquivar o HANDOFF antigo em `docs/inventory/handoff-2026-10-16.md`, reescrever o `HANDOFF.md` no formato de `claude-code-rules.md` §10, e alinhar o `CLAUDE.md` com o modo contínuo.
- **Escolha:** B, a pedido do Rafael (2026-10-25: push autorizado, modo contínuo, corrigir divergências). É também o que `foundation.md` §B, alínea 8, manda fazer.
- **Como se desfaz:** `git revert` do commit.
- **Marcas:** —

## AD-004 — Vite em `127.0.0.1` nesta VM
- **Passo:** C, D1–D4 e todos os testes Playwright
- **Contexto:** `vite.config.ts:9` usa `host: "::"`; a VM não tem IPv6 e o Vite falha com `EAFNOSUPPORT` (`environment.md` §7).
- **Opções:** A) `host: "::"`; B) não fixar o host na configuração das apps novas (o Vite usa `localhost`) e passar `--host` quando for preciso expor.
- **Escolha:** B
- **Porquê:** funciona em IPv4 e IPv6 sem depender da máquina.
- **Como se desfaz:** pôr `server.host` na configuração base.
- **Marcas:** —

## AD-005 — Páginas que a arquitectura funde, e componentes sem uso
- **Passo:** A (mapa de rotas), D1–D4 (mover)
- **Contexto:** `architecture.md` §3 junta `…/documents` a `/verification` e funde as três páginas de verificação do admin (`interpreter-verifications`, `verification-requests`, `verification-history`) em `/verifications`, `/verifications/:id` e `/verifications/history`. O passo D manda **mover, não reescrever**. Há também 5 componentes sem uso alcançável (`docs/inventory/05-route-map.md` §2).
- **Opções:** A) fundir já no D; B) mover cada página como está, para a rota nova mais próxima (`/verification/documents` no intérprete; `/verifications`, `/verifications/requests`, `/verifications/history` no admin), e fundir no H12 (verificação), que reescreve esses ecrãs; C) deixar as rotas antigas.
- **Escolha:** B. Os 5 componentes sem uso não se movem.
- **Porquê:** cumpre "mover, não reescrever" e não perde nenhum ecrã; a fusão exige comportamento novo, que é do H12.
- **Como se desfaz:** no H12 as rotas provisórias dão lugar às finais.
- **Marcas:** —

## AD-006 — Portas de desenvolvimento das apps e da API
- **Passo:** B (`.env.example`), C
- **Contexto:** `architecture.md` dá os nomes `SITE_URL`, `REQUESTER_URL`, `INTERPRETER_URL`, `ADMIN_URL`, `API_URL`, sem portas.
- **Opções:** A) portas por omissão do Vite (todas 5173, em conflito); B) portas fixas: site 5170, requester 5171, interpreter 5172, admin 5173, API 3000.
- **Escolha:** B
- **Porquê:** as quatro apps arrancam ao mesmo tempo (`pnpm dev`) e os links entre apps precisam de endereços estáveis; os cookies de `localhost` partilham-se entre portas (`architecture.md` §4).
- **Como se desfaz:** mudar `.env.example` e a configuração de cada app.
- **Marcas:** —

## AD-007 — Nome dos pacotes do monorepo
- **Passo:** C
- **Contexto:** `architecture.md` §2 manda `@portal-dos-interpretes/<nome>`; o `MASTER-PLAN.md` (passo G) escreve `pnpm --filter @portal/api test`.
- **Opções:** A) `@portal/*`; B) `@portal-dos-interpretes/*`.
- **Escolha:** B
- **Porquê:** a arquitectura é o documento que decide onde vive cada coisa; o comando do plano é um exemplo.
- **Como se desfaz:** renomear os `name` dos `package.json` e os imports.
- **Marcas:** —

## AD-008 — A SPA antiga vive em `legacy/` até ao D4
- **Passo:** C a D4
- **Contexto:** `foundation.md` §C pede o monorepo "sem tocar ainda no código de hoje", e a raiz do repositório tem de passar a ser a raiz do workspace (`package.json` com Turborepo). A SPA antiga ocupa a raiz (`src/`, `package.json`, `vite.config.ts`, …).
- **Opções:** A) deixar a SPA na raiz e misturar as dependências dela com as da raiz do monorepo; B) mover os ficheiros da SPA, sem mudar o conteúdo, para `legacy/`, como pacote do workspace com o seu próprio `package.json`; C) apagar já a SPA.
- **Escolha:** B
- **Porquê:** a raiz fica limpa; a SPA continua a compilar e a arrancar para comparação no passo D; o D4 apaga `legacy/` inteiro.
- **Como se desfaz:** `git mv legacy/* .` antes do D4.
- **Marcas:** —
