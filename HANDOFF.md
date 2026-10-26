# HANDOFF
- Versão: v0.11.0 (H2 fechado em 2026-10-26). **H3 a meio** (sem tag ainda).
- Próximo passo: acabar o H3 — catálogos e página de serviços real (docs/plan/specs/catalogs.md, plano em docs/plan/step-plans/H3.md)
- Remoto: https://github.com/RafaelPilartes/monorepo-portal_dos_interprete-ts (trabalho em `dev`; `main` não se toca)
- Estado do H3 (commit 34e7328 e seguintes): migration 0004, funções, políticas, seed, asserções (0005), API `/admin/catalog/*` com testes, ecrãs do catálogo no admin, `/services` do site a ler da base, Playwright `h3-catalogs` com capturas em docs/plan/evidence/H3. Portões verdes nesse ponto: lint, typecheck, 251 unitários, verify.py 20/20, db:verify (35 testes da API contra a base), e2e 121/121.
- Em aberto neste momento: corrigir os achados da revisão independente do H3 e fechar (v0.12.0):
  1. Perda de actualização: "Desactivar" e o painel enviam a linha inteira; um preço mudado por outra pessoa volta atrás. Fazer PATCH parcial (COALESCE em `catalog.save_*`) ou versão esperada (`STATE_CHANGED`).
  2. Preço vazio grava 0 Kz e o serviço fica público. Enviar `null` (erro no campo) e decidir em auto-decisões se 0 é permitido (provável `> 0`).
  3. O modal do site diz "Duração: Por evento/consulta" ao lado do preço à hora; tirar `duration` ou derivá-la de `pricing_mode`.
  4. Vistas `catalog.*_admin` com `l.*`/`s.*`: listar colunas (ou DROP VIEW antes) para não partir a fase de funções quando uma migration acrescentar colunas.
  5. Razão `locked` genérica em `FIELD_REASONS`: renomear para `pricing_mode_locked` (gatilho na 0004 não se edita: migration nova ou só o mapa aceitar as duas).
  6. Regra do código da língua em três sítios e mensagem do zod que nunca chega ao ecrã: deixar só o CHECK e mapear `languages_code_check` em `DOMAIN_FIELDS`/columns.
  7. Testes em falta: especialidade usada → `IN_USE`; rotas da API de línguas e especialidades; estado de erro do `/services` no site.
  8. Conteúdo do site por slug em dois ficheiros e slug editável: juntar em `serviceContent.ts` e/ou bloquear o slug depois de criado.
  9. Preços do seed fictícios iguais a reais: registar em auto-decisões que o seed é só de desenvolvimento (runbook do Z).
  Depois: AD-032 (decisões do H3: tabelas do directório puxadas do H4, `catalog.item_usage`, conteúdo do site por slug, bigint como número na API), CHANGELOG, run-log, relatório `step-reports/H3.md`, `scripts/set-version.py 0.12.0`, `scripts/close-step.sh`, push.
- Auto-decisões novas: ainda nenhuma no H3 (AD-030, AD-031 são do H2)
- Bloqueios: bundle do histórico antigo (AD-001); push de tags (correr scripts/release-tags.sh, AD-002)
- Por confirmar com a Academia: fixos angolanos (AD-020); limites dos buckets (AD-022); reset-local (AD-025); email genérico (AD-027); preços reais dos serviços; textos legais, margem do gerido, taxa de verificação e dados bancários (PC-02, PC-03, PC-05, PC-06)
- A lembrar no H5/H8: o diálogo de suspensão diz que os pedidos por começar são cancelados; a cascata só chega no H8 (AD-030, item 4)
- Ambiente: arrancar o `dockerd` à mão se `docker info` falhar; `pnpm db:up && pnpm db:bootstrap-admin admin@portal.local` antes do Playwright; `pnpm db:down` no fim
