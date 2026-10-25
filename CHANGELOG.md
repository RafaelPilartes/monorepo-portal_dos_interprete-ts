# Changelog

Uma versão por passo do `docs/plan/MASTER-PLAN.md`. Uma só versão para todo o monorepo.

## 0.8.0 — 2026-10-25 — Passo F (base de dados local)

- Base local em Docker pela CLI do Supabase: `pnpm db:up`, `db:down`, `db:verify`, `db:reset`, `db:types`, `db:status`.
- Primeira migration: schemas por domínio, domínios partilhados, auditoria que não se altera nem apaga, avisos e fila de emails, com o catálogo de avisos gerado da spec.
- Tudo nasce fechado: só a leitura dos próprios avisos e marcá-los como lidos ficam abertos à sessão.
- `db:verify` levanta uma base limpa, reaplica e compara, confere os tipos e corre 22 asserções; um Ctrl+C a meio não deixa contentores.
- Relatório: `docs/plan/step-reports/F.md`.

## 0.7.0 — 2026-10-25 — Passo E (pacotes partilhados)

- Validações e catálogo de erros únicos (`core`), formatação de kwanzas e datas de Luanda (`i18n`), componentes base (`ui`), camada de dados (`data`) e sessão com guardas (`auth`).
- O selo de estado já não rebenta com estados desconhecidos; a fonte do site passa a carregar.
- Relatório: `docs/plan/step-reports/E.md`.

## 0.6.0 — 2026-10-25 — Passo D4 (mover o `interpreter-web`; apagar a SPA antiga)

- A área do intérprete passa para `apps/interpreter-web`, nos caminhos novos; áreas sem ecrã têm aviso honesto.
- A SPA antiga (`legacy/`) foi apagada; fica no git até `aca929a`.
- Cada link das barras laterais dos três painéis é verificado por teste.
- Relatório: `docs/plan/step-reports/D4.md`.

## 0.5.0 — 2026-10-25 — Passo D3 (mover o `requester-web`)

- A área do solicitante passa para `apps/requester-web`, nos caminhos novos, com as páginas de perfil do intérprete e as de entrada.
- Os links "Entrar", "Registar" e "Ver Perfil" do site chegam a páginas reais.
- Relatório: `docs/plan/step-reports/D3.md`.

## 0.4.0 — 2026-10-25 — Passo D2 (mover o `admin-web`)

- O painel da equipa passa para `apps/admin-web`, nos caminhos novos (sem `/dashboard/admin`).
- Componentes de painel partilhados em `packages/ui`; `AppProviders` em `packages/features`.
- A gestão da equipa mostra dados fictícios e recusa alterações até a base estar ligada (AD-014).
- Relatório: `docs/plan/step-reports/D2.md`.

## 0.3.0 — 2026-10-25 — Passo D1 (mover o `site-web`)

- O site público passa para `apps/site-web`, igual ao de hoje (mocks incluídos); `/home` redirecciona para `/`; 404 em português.
- Base partilhada em `packages/ui`; cartão e páginas de perfil em `packages/features`; páginas de entrada em `packages/auth`.
- Verificação de rotas por Playwright (`pnpm e2e`); `verify.py` com 6 verificações.
- Relatório: `docs/plan/step-reports/D1.md`.

## 0.2.0 — 2026-10-25 — Passo C (monorepo vazio a compilar)

- pnpm + Turborepo; a SPA antiga passa intacta para `legacy/` (AD-008).
- Quatro apps (`site-web`, `requester-web`, `interpreter-web`, `admin-web`) com página "a arrancar" e versão no rodapé; API Fastify com `GET /health` e Dockerfile.
- `packages/config` partilhado; oito pacotes vazios.
- `scripts/verify.py` (5 verificações, com self-test), hook `pre-push`, ADR-001 a ADR-007, `scripts/set-version.py`.
- Relatório: `docs/plan/step-reports/C.md`.

## 0.1.0 — 2026-10-25 — Passo B (Git do zero) e passo A (inventário)

- Passo A: mapa de rotas, componentes partilhados, segredos (nenhum encontrado) e mocks em `docs/inventory/05-route-map.md`; o explainer aponta para `docs/plan/decisions.md`.
- Passo B: `.gitattributes` com `eol=lf` (182 ficheiros normalizados de CRLF para LF), `.gitignore` alargado (`*.bundle`, credenciais de teste), `.env.example` com os nomes das variáveis, `CLAUDE.md` em modo contínuo.
- O repositório já tinha sido recomeçado sem histórico; o bundle do histórico antigo fica para o Rafael (AD-001). As tags são locais e recriadas por `scripts/release-tags.sh` (AD-002).
