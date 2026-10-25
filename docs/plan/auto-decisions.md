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

## AD-017 — `interpreter-web`: áreas sem ecrã, estado de verificação desconhecido, registo de intérpretes, fim do `legacy/`
- **Passo:** D4
- **Contexto:** (1) a barra lateral do intérprete já ligava a sete áreas que o router antigo não tinha (biblioteca, comunidade, fórum, formação, mentorias, benefícios, suporte); na SPA antiga caíam no redireccionamento para `/home`. (2) `VerificationRequestDetailsModal` não conhecia os estados `active` e `suspended`, que o próprio tipo admite, e rebentava com eles, o mesmo defeito do `StatusBadge` do inventário (item 7). (3) O "Registar" da página "Para Intérpretes" do site levava ao registo do solicitante. (4) O D4 apaga a SPA antiga (`foundation.md` §D, item 6), que vivia em `legacy/` (AD-008).
- **Escolha:** (1) as sete áreas têm rota nos caminhos de `architecture.md` §3 com o `ModulePlaceholder` e o texto "Esta área ainda não está disponível. Chega num dos próximos passos do Portal." (sem fingir conteúdo); cada passo H da comunidade substitui o seu. (2) um estado não listado mostra-se com o estilo neutro (o de `expired`) e um rótulo em português ("Activa", "Suspensa", ou "Estado desconhecido"), em vez de rebentar; testado. (3) vai para `interpreter-web/register` (`appUrl('interpreter', '/register')`). (4) `legacy/` e `scripts/migrate/` apagados; ficam no git até à tag `v0.5.0`.
- **Porquê:** nenhum link leva a um 404 nem a um ecrã partido; nenhuma área finge estar pronta.
- **Notas da revisão do D4:** (5) as páginas de perfil de colegas ligam de volta a `/interpreters`, que o `interpreter-web` não tinha: passa a ter um `ModulePlaceholder` "Lista de Profissionais" até ao directório do H4. (6) O registo no `interpreter-web` abre com "Intérprete" pré-seleccionado (`defaultAccountType`); o site ainda não tem link para o login do `interpreter-web` ("Entrar" vai para o do solicitante) — fica para o H2, que liga a sessão partilhada (ADR-007). (7) "Ver perfil público" em `profile/overview` liga a `/interpreters/maria-santos`, um intérprete que os mocks não têm (mostra "Perfil não encontrado"), como na SPA antiga; resolve-se no H4. (8) `/notifications` (nas rotas novas de `architecture.md` §3 para as três apps de sessão) fica para o passo das notificações (H5), que cria o ecrã; nada liga a essa rota hoje.
- **Como se desfaz:** (1)–(3) e (5)–(8) nos passos H; (4) `git checkout aca929a -- legacy` (o último commit de `dev` com a SPA antiga; a tag `v0.5.0` só existe localmente até o Rafael correr `scripts/release-tags.sh`).
- **Marcas:** —

## AD-018 — `packages/ui` pode depender de `packages/i18n`
- **Passo:** E
- **Contexto:** `foundation.md` §E põe `MoneyAmount` e o `StatusBadge` com fallback em `ui`, mas `architecture.md` §2 diz que `ui` não depende de nada além de React, Radix, Tailwind e Lucide. O `MoneyAmount` precisa do `formatAoa` e o fallback do texto "Estado desconhecido", que vivem em `i18n`.
- **Opções:** A) reescrever a formatação em `ui` (a mesma regra em dois sítios); B) `ui → i18n`, registado em `verify.py` (`package-dependencies`).
- **Escolha:** B. `i18n` é puro (sem domínio, sem rede), por isso não traz domínio para `ui`.
- **Como se desfaz:** passar o texto e o valor formatado por props e tirar a dependência.
- **Marcas:** —

## AD-019 — `packages/auth` lê a sessão pela camada de dados
- **Passo:** E
- **Contexto:** `architecture.md` §2 dá a `auth` "cliente Supabase, sessão partilhada, guardas" mas proíbe o Supabase fora de `packages/data/src/dao/` (regra 4) e não lista `data` nas dependências de `auth`. As duas frases contradizem-se.
- **Opções:** A) excepção para `auth` importar o Supabase; B) o cliente e o `SessionDAO` vivem em `packages/data/src/dao/supabase/`, e `auth` depende de `data` (e de `core` para as mensagens do catálogo); C) juntar `auth` a `data`.
- **Escolha:** B. `auth` fica com o armazenamento em cookie do domínio-pai (ADR-007, sem Supabase), o `SessionProvider` com uma fonte de sessão injectável e as três guardas. A fonte real (sessão Supabase + `GET /me` para papéis e nível) liga-se no H1/H2.
- **Porquê:** uma só porta para o Supabase, verificada pelo ESLint e pelo `verify.py`; as guardas testam-se sem rede.
- **Como se desfaz:** permitir o Supabase em `packages/auth/src/session/` e tirar a dependência de `data`.
- **Marcas:** —

## AD-020 — Números de telefone sem indicativo: só os angolanos de 9 dígitos
- **Passo:** E (revisão)
- **Contexto:** `data-model.md` §1 dá só o exemplo de telemóvel (`923000000` → `+244923000000`). A primeira versão de `normalizePhone` punha um `+` à frente de qualquer outro número sem indicativo, o que transformava um fixo de Luanda (`222000000`) num número da Mauritânia (`+222…`), aceite como válido.
- **Opções:** A) adivinhar o país; B) número nacional angolano (9 dígitos, começa por 9 ou por 2) recebe `+244`; qualquer outro número tem de vir com o indicativo (`+` ou `00`), senão é recusado com `INVALID_PHONE`.
- **Escolha:** B
- **Porquê:** recusar é reversível e não grava um contacto errado; a pessoa vê a mensagem do catálogo e corrige.
- **Como se desfaz:** alargar a expressão em `packages/core/src/phone.ts`. **Por confirmar** com a Academia se os fixos angolanos interessam (só há exemplo de telemóvel).
- **Marcas:** [RISCO] dados pessoais (contacto).

## AD-021 — Notas da revisão do passo E
- **Passo:** E
- **Contexto e registo:** (1) o cliente Supabase vive em `packages/data/src/dao/supabase/client.ts` e não em `packages/data/src/config/` como desenha `architecture.md` §7, porque a regra 4 da mesma arquitectura só deixa falar com o Supabase dentro de `dao/` (verificado pelo ESLint e pelo `verify.py`). (2) `claude-code-rules.md` §9 diz que o catálogo de erros vive em `apps/api/src/lib/`; `architecture.md` §6 e `data-model.md` §0 dizem `@portal-dos-interpretes/core/errors`. Segue-se a arquitectura (um sítio só, partilhado pela API e pelas apps); `apps/api/src/lib/dbErrors.ts` (passo G) traduz da base para esses códigos. (3) As mensagens dos formulários vêm do catálogo (`catalogMessage`), para o formulário e a API dizerem o mesmo; os textos de ecrã comuns vivem em `packages/i18n`. (4) As mensagens com parâmetros (`{min}`, `{max}`, …) preenchem-se com `params` vindos da API, ou lendo-os de um texto que siga exactamente o modelo do catálogo; nunca aparecem chavetas no ecrã. (5) O `returnTo` ainda não é lido por ninguém; o H2 tem de o validar (só caminhos relativos ou as quatro origens das apps) para não abrir um redireccionamento para fora.
- **Marcas:** [RISCO] visibilidade (item 5, redireccionamento aberto se mal feito no H2).

## AD-022 — Limites dos buckets que as specs não fixam
- **Passo:** F
- **Contexto:** `architecture.md` §5 manda pôr os limites de cada bucket em `supabase/config.toml`. As specs fixam `payment-proofs` e `verification-docs` (PDF/JPG/PNG, 10 MB), `chat-attachments` (PDF/JPG/PNG, 5 MB), `feed-images` (JPG/PNG/WebP, 5 MB), `library` (PDF, 20 MB) e o tamanho da fotografia de perfil (2 MB, sem tipos). Nada dizem de `interpreter-media` e `site-content`.
- **Opções:** A) sem limite; B) os mesmos limites das imagens do feed.
- **Escolha:** B — `avatars` 2 MB e `interpreter-media`/`site-content` 5 MB, todos JPG/PNG/WebP. O limite global do Storage desce de 50 MB para 20 MB (o maior que as specs pedem).
- **Porquê:** um bucket público sem limite aceita qualquer ficheiro; apertar agora e alargar depois não parte nada.
- **Como se desfaz:** mudar os valores em `supabase/config.toml`. **Por confirmar** com a Academia.
- **Marcas:** —

## AD-023 — Os avisos guardam o código e os dados, não o texto
- **Passo:** F
- **Contexto:** `data-model.md` §10 dá a `notify.notifications` as colunas `title` e `body`; `notifications.md` (`R-NOT-01`) diz que os textos ficam em `packages/i18n` (portal) e nos modelos de email da API. As duas frases contradizem-se: com `title`/`body` na base, o texto teria de ser escrito em SQL, em português, longe do resto dos textos.
- **Opções:** A) `title`/`body` escritos pelas funções SQL; B) a linha guarda `kind`, `payload jsonb` e `link`; o portal escreve o título e o corpo com `packages/i18n` a partir do código e dos dados.
- **Escolha:** B (segue `R-NOT-01`, a regra; o modelo de dados é o "onde").
- **Porquê:** um só sítio para os textos do ecrã (D-84) e nenhum português na base.
- **Como se desfaz:** migration nova com `title`/`body` e preenchê-los em `notify.enqueue`.
- **Marcas:** —

## AD-024 — Notas da execução do passo F
- **Passo:** F
- **Registo:** (1) A migration `0001` cria a estrutura e só as duas funções de gatilho de que as tabelas precisam ao nascer (`util.set_updated_at`, `util.forbid_mutation`); as outras funções que a spec põe no esqueleto (`util.now`, `util.next_code`, `util.app_timezone`, `audit.record`, `notify.enqueue`, `notify.enqueue_email`, `auth_helper.*`) vivem em `packages/db/functions/`, a fase reaplicável de `architecture.md` §5, porque vão mudar (o `auth_helper.account_id()` muda no H1). (2) `auth_helper` tem por agora só `account_id()` (= `auth.uid()`) e `is_active()`; as verificações de perfil activo e termos aceites (`R-ACC-03`, `R-PRIV-02`) e os outros ajudantes precisam das tabelas do H1. (3) `audit.events.actor_account` não tem chave estrangeira: uma linha imutável não pode ser posta a `NULL` quando uma conta é apagada, e o rasto tem de sobreviver à conta. (4) O relógio dos testes é a definição de sessão `util.frozen_now`, que só um cliente SQL directo consegue fixar (o PostgREST não deixa os pedidos mudar definições). (5) O seed regista-se em `util.applied_migrations` com o prefixo `seed/`, e `migrate.sh --seed` recusa um seed aplicado que mudou, tal como as migrations. (6) `grants/00-reset.sql` revoga tudo (tabelas, colunas, sequências e funções) a `PUBLIC`, `anon`, `authenticated` e `service_role` nos schemas do projecto antes de cada aplicação, para os ficheiros de `grants/` serem a lista completa do que está concedido. (7) A CLI arranca com `--ignore-health-check`: o PostgREST só fica saudável depois de as migrations criarem os schemas expostos; os scripts esperam por todos os serviços saudáveis depois das fases. (8) `verify.sh` e `reset-local.sh` têm, além do `trap cleanup EXIT INT TERM` de `claude-code-rules.md` §5, um `trap` que termina o script depois da limpeza num Ctrl+C, para não continuar para o passo seguinte.
- **Marcas:** —
