# Changelog

Uma versão por passo do `docs/plan/MASTER-PLAN.md`. Uma só versão para todo o monorepo.

## 0.18.0 — 2026-11-06 — Passo H9 (avaliações)

- Depois de cada serviço concluído, quem pede e o intérprete avaliam-se um ao outro, com estrelas e um comentário.
- Cada avaliação fica escondida até as duas partes avaliarem, ou até passarem 14 dias; nessa altura, quem não avaliou já não avalia.
- O perfil do intérprete mostra a média e as avaliações; o intérprete convidado vê as avaliações de quem pede.
- A equipa pode esconder uma avaliação com motivo; deixa de contar para a média.
- Relatório: `docs/plan/step-reports/H9.md`.

## 0.17.0 — 2026-11-06 — Passo H8 (ciclo do serviço)

- Quem pede pode cancelar o pedido; a menos de 24 horas do início, o ecrã avisa que fica registado no perfil.
- O intérprete pode cancelar a sua participação antes do início, e marcar o serviço como feito depois da hora de fim.
- Quem pede confirma o serviço ou abre uma disputa; sem resposta, o serviço fica confirmado automaticamente.
- A equipa vê os pedidos e as disputas no painel e resolve-as com notas.
- A agenda do intérprete mostra os serviços aceites e os que faltam marcar como feitos.
- Suspender uma conta cancela os pedidos e participações que ainda não começaram, e avisa a outra parte.
- Relatório: `docs/plan/step-reports/H8.md`.

## 0.16.0 — 2026-11-05 — Passo H7 (pedido aberto)

- Quem pede pode publicar o pedido para os intérpretes, em dois modos: "eu escolho" (candidatam-se com o seu preço) ou "o primeiro que aceitar" (a um valor fixo por intérprete, tudo incluído).
- O intérprete vê em "Solicitações Abertas" os pedidos para si, com o valor que ganha, e aceita ou candidata-se com uma mensagem.
- Quem pede vê os candidatos e escolhe; os restantes são avisados quando o pedido fica completo.
- Relatório: `docs/plan/step-reports/H7.md`.

## 0.15.0 — 2026-11-05 — Passo H6 (negociação de preço)

- No chat de um pedido, quem pede e o intérprete convidado podem propor outro preço; a proposta anterior fica riscada.
- A outra parte aceita ou recusa; uma proposta aceite passa a ser o preço proposto, e o preço só fica fechado quando o intérprete aceita o pedido.
- Um intérprete que não aceita negociar não recebe propostas; depois de aceite o pedido, a negociação fecha.
- Relatório: `docs/plan/step-reports/H6.md`.

## 0.14.0 — 2026-10-31 — Passo H5 (pedidos, pedido directo, chat e sino)

- Quem pede escolhe o intérprete num assistente de sete passos; o total aparece na revisão, calculado pelo servidor.
- O intérprete recebe o convite, vê o preço e aceita ou recusa com um motivo; quando todos aceitam, o pedido fica confirmado.
- Cada pedido tem o chat com cada intérprete e uma linha do tempo do que aconteceu.
- O sino no cabeçalho dos painéis mostra os avisos, e cada um tem a sua página de notificações.
- Convites sem resposta expiram; um pedido sem intérpretes suficientes avisa antes e expira à hora de início.
- Por agora só existe o pedido directo; publicar para intérpretes e pedir à plataforma chegam nos próximos passos.
- Relatório: `docs/plan/step-reports/H5.md`.

## 0.13.0 — 2026-10-31 — Passo H4 (perfil do intérprete e directório)

- O intérprete preenche o perfil a sério: fotografia, biografia, modalidade, línguas, serviços e preços, percurso, contactos, vídeos, artigos e disponibilidade.
- O perfil diz o que falta para aparecer no directório; com tudo preenchido, o intérprete aparece no site e na área de quem pede.
- No site, o directório tem pesquisa e filtros; abrir um perfil leva ao login e volta ao mesmo perfil.
- Quem pede vê o perfil completo, com contactos e preços, e guarda intérpretes nos favoritos.
- A equipa pode remover um vídeo ou artigo com um motivo; o autor é avisado.
- Relatório: `docs/plan/step-reports/H4.md`.

## 0.12.0 — 2026-10-30 — Passo H3 (catálogos)

- A equipa gere línguas, especialidades e serviços no painel, com o preço de tabela e o modo de preço de cada serviço.
- Um item já usado não se apaga, desactiva-se; o modo de preço de um serviço usado não muda.
- A página de serviços do site mostra os serviços activos da base, com o preço de tabela.
- Os preços dos serviços na base local são fictícios, só para desenvolvimento.
- Relatório: `docs/plan/step-reports/H3.md`.

## 0.11.0 — 2026-10-26 — Passo H2 (contas, papéis, organizações e consentimento)

- Registo real com aceitação dos termos e da política em vigor, confirmação por email, recuperação da palavra-passe.
- O papel cria-se no onboarding (particular, empresa ou intérprete); quem tem os dois troca de app sem voltar a entrar.
- Organizações com membros, convites por email, um só dono, transferir a posse, sair e remover.
- A equipa lista solicitantes, intérpretes e organizações, e suspende ou reactiva com motivo; quem está suspenso vê "Conta suspensa".
- Uma nova versão dos documentos legais tem de ser aceite antes de continuar, em todas as apps.
- Os três painéis ficaram mais densos e sóbrios (barra lateral, cabeçalho com troca de papel, controlos e emblemas); o site não mudou.
- Relatório: `docs/plan/step-reports/H2.md`.

## 0.10.0 — 2026-10-25 — Passo H1 (equipa, configuração e auditoria)

- A área da equipa (`admin-web`) tem login real; quem não é da equipa vê que a área é só para a equipa.
- Equipa, configuração da plataforma por versões publicadas, documentos legais, tipos de documento da verificação e auditoria, sobre a base de dados.
- Publicar a configuração mostra as diferenças, não edita versões em vigor e fica na auditoria com o valor antes e depois.
- `pnpm db:bootstrap-admin <email>` cria o primeiro super-administrador na base local.
- Relatório: `docs/plan/step-reports/H1.md`.

## 0.9.0 — 2026-10-25 — Passo G (API)

- A API arranca só com a configuração completa e diz em português o que falta.
- Sessão verificada pela chave do Auth, conta e nível de equipa vindos da base, rotas fechadas por omissão, auditoria com pedido e IP, limites de pedidos.
- Fila de email: os avisos enfileirados chegam ao servidor de email local, com novas tentativas e sem envios duplicados.
- Ficheiros privados por URL assinado, com quem pode decidido pela base.
- `GET /health` diz se a base tem a migration que a API espera.
- Relatório: `docs/plan/step-reports/G.md`.

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
