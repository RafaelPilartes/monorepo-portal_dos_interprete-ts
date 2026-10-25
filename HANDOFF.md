# HANDOFF
- Versão: v0.2.0 (C fechado em 2026-10-25)
- Próximo passo: D1 — mover o `site-web` (docs/plan/specs/foundation.md §D; plano em docs/plan/step-plans/D1.md)
- Remoto: https://github.com/RafaelPilartes/monorepo-portal_dos_interprete-ts (trabalho em `dev`; `main` não se toca)
- Estado: 17 testes verdes em 14 pacotes; verify.py 5/5 (self-test 5/5); migrations 0; db:verify ainda não existe (passo F)
- Em aberto neste momento: nada
- Auto-decisões novas neste passo: AD-007 (nome dos pacotes), AD-008 (SPA antiga em legacy/)
- Bloqueios: bundle do histórico antigo (AD-001); push de tags (correr scripts/release-tags.sh, AD-002)
- Ambiente: arrancar o `dockerd` à mão se `docker info` falhar (a VM reiniciou uma vez); `docker build` precisa do CA do proxy (ver cabeçalho de apps/api/Dockerfile)
