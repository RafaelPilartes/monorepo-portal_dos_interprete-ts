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
