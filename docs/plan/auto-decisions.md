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

## AD-009 — Cartão do carrossel sem link à volta
- **Passo:** D1 (site-web)
- **Contexto:** em `InterpretersCarousel`, o cartão inteiro estava dentro de um `<a>` e o cartão tem o seu próprio link "Ver Perfil": `<a>` dentro de `<a>`, HTML inválido, que o React avisa na consola (o aviso já existia na SPA antiga, `docs/plan/environment.md` §7). O passo D exige rotas "sem erros de consola".
- **Opções:** A) manter e aceitar o erro; B) tirar o link exterior e deixar só o "Ver Perfil"; C) tirar o link interior.
- **Escolha:** B
- **Porquê:** é a mudança mais pequena que dá HTML válido; o destino continua o mesmo (login do solicitante com `returnTo`, D-05). Perde-se só o clique no resto do cartão.
- **Como se desfaz:** voltar a pôr o `<a>` à volta e tirar o link interior no modo compacto.
- **Marcas:** —

## AD-010 — `site-web` usa `packages/features`; endereços das apps em `packages/ui`
- **Passo:** D1
- **Contexto:** `architecture.md` §2 não lista `features` nas dependências do `site-web`, mas o directório público do site (D-05) usa o mesmo cartão de intérprete (`InterpreterCard`) que o `requester-web`, e o cartão tem domínio (não pode ir para `ui`). Os endereços das quatro apps (`appUrl`) também não cabem em nenhum pacote da regra: `core` não pode depender do Vite.
- **Opções:** A) duplicar o cartão no site; B) permitir `site-web → features` e registá-lo na regra de `verify.py` (`package-dependencies`); C) pôr o cartão em `ui` com dados genéricos.
- **Escolha:** B. `appUrl` fica em `packages/ui/src/lib/app-urls.ts` (configuração de navegação, sem domínio).
- **Porquê:** uma só cópia do cartão; a excepção fica escrita e verificada, e qualquer outra dependência fora da regra falha o `verify.py`.
- **Como se desfaz:** mover o cartão para o site e tirar a excepção de `ALLOWED_DEPENDENCIES`.
- **Marcas:** —

## AD-011 — O 404 regista um aviso, não um erro, na consola
- **Passo:** D1
- **Contexto:** o `NotFound` antigo fazia `console.error` a cada visita; o passo D exige rotas sem erros de consola, e o 404 é agora uma rota alcançável (`foundation.md` §D, item 4).
- **Opções:** A) manter `console.error` e excluir o 404 da verificação; B) `console.warn`.
- **Escolha:** B
- **Porquê:** uma página inexistente não é um erro da app; a verificação de erros continua a valer para o 404.
- **Como se desfaz:** voltar a `console.error`.
- **Marcas:** —

## AD-012 — Links das páginas de entrada corrigidos ao mudar de app
- **Passo:** D1
- **Contexto:** as páginas de entrada antigas apontavam para rotas inexistentes (`/home/register`, `/home/login`, `/portal-interpretes`) e para `/home` do site, que agora é outra app.
- **Opções:** A) movê-las com os links partidos; B) `/register` e `/login` dentro da app; logótipo para o site por `appUrl('site')`.
- **Escolha:** B (`foundation.md` §D, item 3: os links entre apps usam as variáveis `*_URL`). Testado em `packages/auth/src/pages/links.test.tsx`.
- **Como se desfaz:** `git revert` das linhas.
- **Marcas:** —

## AD-013 — Entre o D1 e o D3, "Entrar", "Registar" e "Ver Perfil" do site levam a um ecrã provisório
- **Passo:** D1 a D3; `returnTo` só no H2/H4
- **Contexto:** o site já aponta para `requester-web` (`/login`, `/register`, `/login?returnTo=/interpreters/<slug>`), mas o `requester-web` só recebe as rotas no D3, e o login real (que lê `returnTo`) é do H2; o regresso ao perfil é critério do H4 (`MASTER-PLAN.md`).
- **Opções:** A) manter os links internos antigos até ao D3; B) apontar já para o destino final e aceitar o ecrã provisório entretanto.
- **Escolha:** B
- **Porquê:** os links ficam certos uma só vez; o estado intermédio dura do D1 ao D3 e está à vista no HANDOFF.
- **Como se desfaz:** nada a desfazer depois do D3; o `returnTo` fecha-se no H2/H4.
- **Marcas:** [RISCO] visibilidade (D-05): até ao H4 o regresso ao perfil depois do login não acontece.

## AD-014 — `admin-web`: equipa com dados de pré-visualização, caminhos provisórios e layout partilhado
- **Passo:** D2
- **Contexto:** (1) `AdminTeam` é o único ecrã que lia dados reais, pela camada de dados antiga (`viewModels` → `UseCase` → `SupabaseDAO`), que não se migra (`architecture.md` §7) e chamava o Supabase fora de `packages/data/src/dao/` (regra `no-direct-data-access`); o projecto remoto também não se toca (`claude-code-rules.md` §1.1). (2) A arquitectura tem 8 rotas de comunidade para 10 placeholders antigos. (3) O `DashboardLayout` tinha "Meu Perfil" em `/dashboard/<papel>/perfil` e "Configurações" em `/home`, rotas que não existiam, e precisa do `react-router-dom` em `packages/ui`.
- **Opções:** (1) A) migrar a camada antiga; B) substitutos locais com as mesmas assinaturas, dados fictícios de leitura e escritas recusadas com mensagem em português; C) esconder o ecrã. (2) A) fundir já; B) caminhos provisórios. (3) A) manter os links partidos; B) props `profileHref`/`settingsHref`, escondendo o item quando a app não tem a rota.
- **Escolha:** (1) B — `apps/admin-web/src/viewModels/*.viewmodel.ts` e `team-preview-data.ts`; o ecrã nunca mostra um sucesso que não aconteceu (as escritas falham com "A gestão da equipa fica disponível quando a base de dados for ligada. Nada foi alterado."). O H1 substitui-os pela camada nova. (2) B — `modules/community` → `/community/feed`, `modules/benefits` → `/community/partners`, `modules/legal` → `/community/library/legal` (a arquitectura põe o apoio jurídico dentro da biblioteca, D-76), `modules/support` → `/support/tickets`; os restantes como na tabela. (3) B, com `react-router-dom` como dependência par de `packages/ui`.
- **Porquê:** mover sem reescrever, sem tocar no remoto e sem falhas silenciosas.
- **Como se desfaz:** H1 apaga os substitutos; os passos de comunidade (H16–H19) fixam as rotas finais.
- **Notas da revisão do D2:** `AppProviders` (tema, cache de dados, dicas, avisos) vive em `packages/features` e não em `ui`, porque `ui` não pode depender do `@tanstack/react-query` (`architecture.md` §2). A página de login do `admin-web` esconde "Registe-se aqui" (`registerHref={null}`), porque a equipa não se regista. Ao tentar mudar a equipa aparecem dois avisos de erro (o do substituto e o da página), como na SPA antiga; nada mostra sucesso. Os avisos de sucesso sem efeito dos outros ecrãs do admin (por exemplo aprovar intérprete, suspender) vêm da SPA antiga e estão no inventário; desaparecem quando cada passo H liga o ecrã à base.
- **Marcas:** —

## AD-015 — No `requester-web`, as páginas de perfil do intérprete ficam dentro do layout do solicitante
- **Passo:** D3
- **Contexto:** na SPA antiga, `/interpreters/:slug` e as subpáginas viviam dentro do `PublicLayout` do site (cabeçalho público). Com D-05 saem do site; `architecture.md` §3 põe-nas no `requester-web` (e no `interpreter-web`), sem dizer com que moldura.
- **Opções:** A) sem moldura nenhuma; B) dentro do `DashboardLayout` do solicitante, ao lado de `/interpreters` (a lista); C) copiar o cabeçalho público para o `requester-web`.
- **Escolha:** B
- **Porquê:** quem as vê já tem sessão; a barra lateral leva de volta à lista e ao resto da app; não há cópia do cabeçalho do site.
- **Como se desfaz:** mudar as quatro rotas para fora do `<Route element={<RequesterLayout />}>`.
- **Marcas:** —

## AD-016 — O que o `requester-web` herda da SPA antiga e fica como está até aos passos H
- **Passo:** D3
- **Contexto:** a revisão do D3 confirmou comportamentos antigos que o "mover, não reescrever" mantém, e que contrariam `claude-code-rules.md` §9 ("Nada falha em silêncio").
- **Registo:** (1) `RequestDetails` liga a `/requests/:id/edit`, rota que nunca existiu; mostra o 404 em português (testado no e2e) e só aparece em pedidos `pending`, que o mock não tem. (2) O botão "Avaliar" em `RequestDetails` muda um estado que nada lê (`_showReviewModal`): não faz nada, como na SPA antiga. (3) `NewRequest`, `RequesterProfile`, `RequesterSettings` e `RecoverPassword` mostram avisos de sucesso sem nada por trás. (4) AD-013 fica fechado para "Entrar" e "Registar" (o site já chega ao login e ao registo reais); falta só o `returnTo`, do H2/H4.
- **Escolha:** ficam como estão; cada passo H que liga o ecrã à base substitui o comportamento (H2 entrada, H5 pedidos, H9 avaliações).
- **Como se desfaz:** nos passos H indicados.
- **Marcas:** [RISCO] avisos de sucesso falsos à vista enquanto os ecrãs usam mocks.
