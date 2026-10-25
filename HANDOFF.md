# HANDOFF
- Versão: v0.5.0 (D3 fechado em 2026-10-25)
- Próximo passo: D4 — mover o `interpreter-web` e apagar a SPA antiga (docs/plan/specs/foundation.md §D; plano em docs/plan/step-plans/D4.md)
- Remoto: https://github.com/RafaelPilartes/monorepo-portal_dos_interprete-ts (trabalho em `dev`; `main` não se toca)
- Estado: 42 testes unitários verdes; e2e 66/66 (site + admin + solicitante); verify.py 6/6 (self-test 6/6); migrations 0; db:verify ainda não existe (passo F)
- Em aberto neste momento: nada
- Auto-decisões novas neste passo: AD-015, AD-016
- Bloqueios: bundle do histórico antigo (AD-001); push de tags (correr scripts/release-tags.sh, AD-002)
- O que o Rafael pode ver no ecrã: `pnpm dev` → site 5170, solicitante 5171, equipa 5173 (sem login: o login real é do H1/H2). Os ecrãs mostram dados fictícios e alguns avisos de sucesso sem nada por trás (AD-016).
- Ambiente: arrancar o `dockerd` à mão se `docker info` falhar; `docker build` precisa do CA do proxy (cabeçalho de apps/api/Dockerfile)
