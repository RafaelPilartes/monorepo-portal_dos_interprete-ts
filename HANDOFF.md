# HANDOFF
- Versão: v0.3.0 (D1 fechado em 2026-10-25)
- Próximo passo: D2 — mover o `admin-web` (docs/plan/specs/foundation.md §D; plano em docs/plan/step-plans/D2.md)
- Remoto: https://github.com/RafaelPilartes/monorepo-portal_dos_interprete-ts (trabalho em `dev`; `main` não se toca)
- Estado: 28 testes unitários verdes; e2e 12/12 (site); verify.py 6/6 (self-test 6/6); migrations 0; db:verify ainda não existe (passo F)
- Em aberto neste momento: nada
- Auto-decisões novas neste passo: AD-009 a AD-013
- Bloqueios: bundle do histórico antigo (AD-001); push de tags (correr scripts/release-tags.sh, AD-002)
- O que o Rafael pode ver no ecrã: `pnpm --filter @portal-dos-interpretes/site-web dev` → http://localhost:5170 (o site igual ao de hoje). "Entrar", "Registar" e "Ver Perfil" levam a um ecrã provisório do requester-web até ao D3 (AD-013).
- Ambiente: arrancar o `dockerd` à mão se `docker info` falhar; `docker build` precisa do CA do proxy (cabeçalho de apps/api/Dockerfile)
