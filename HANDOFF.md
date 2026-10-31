# HANDOFF
- Versão: v0.13.0 (H4 fechado em 2026-10-31)
- Próximo passo: H5 — núcleo dos pedidos, pedido directo, chat e sino de notificações (docs/plan/specs/requests-core.md, requests-direct.md, notifications.md)
- Remoto: https://github.com/RafaelPilartes/monorepo-portal_dos_interprete-ts (trabalho em `dev`; `main` não se toca)
- Feito no H4: perfil do intérprete, disponibilidade, conteúdo, directório (site, quem pede, colegas), favoritos, remoção de conteúdo pela equipa. 13 achados da revisão corrigidos ou registados (docs/plan/step-reports/H4.md).
- A lembrar no H5: `directory.is_eligible_for` (R-DIR-09, critério 4 do H4) nasce com os pedidos; o assistente de pedido ainda usa `features/mocks/interpretersMocks.ts` (apagar ao ligá-lo ao directório); "Pedir este intérprete" no perfil; acrescentar os pedidos a `catalog.item_usage`; o diálogo de suspensão diz que os pedidos por começar são cancelados (AD-030.4).
- Auto-decisões novas: AD-033 (H4)
- Bloqueios: bundle do histórico antigo (AD-001); push de tags (correr scripts/release-tags.sh, AD-002)
- Por confirmar com a Academia: fixos angolanos (AD-020); limites dos buckets (AD-022); reset-local (AD-025); email genérico (AD-027); preços reais dos serviços (AD-032.8); textos legais, margem do gerido, taxa de verificação e dados bancários (PC-02, PC-03, PC-05, PC-06)
- Ambiente: arrancar o `dockerd` à mão se `docker info` falhar (apagar `/var/run/docker.pid` se ficou de uma sessão anterior); `pnpm db:up && pnpm db:bootstrap-admin admin@portal.local` antes do Playwright; `pnpm db:down` no fim
