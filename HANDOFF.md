# HANDOFF
- Versão: v0.4.0 (D2 fechado em 2026-10-25)
- Próximo passo: D3 — mover o `requester-web` (docs/plan/specs/foundation.md §D; plano em docs/plan/step-plans/D3.md)
- Remoto: https://github.com/RafaelPilartes/monorepo-portal_dos_interprete-ts (trabalho em `dev`; `main` não se toca)
- Estado: 37 testes unitários verdes; e2e 43/43 (site + admin); verify.py 6/6 (self-test 6/6); migrations 0; db:verify ainda não existe (passo F)
- Em aberto neste momento: nada
- Auto-decisões novas neste passo: AD-014
- Bloqueios: bundle do histórico antigo (AD-001); push de tags (correr scripts/release-tags.sh, AD-002)
- O que o Rafael pode ver no ecrã: `pnpm dev` → site em http://localhost:5170, painel da equipa em http://localhost:5173 (sem login: o login real é do H1/H2). "Entrar"/"Registar" do site ainda levam a um ecrã provisório até ao D3 (AD-013).
- Ambiente: arrancar o `dockerd` à mão se `docker info` falhar; `docker build` precisa do CA do proxy (cabeçalho de apps/api/Dockerfile)
