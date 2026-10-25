# HANDOFF
- Versão: v0.6.0 (D4 fechado em 2026-10-25; os quatro passos D estão fechados)
- Próximo passo: E — pacotes partilhados (docs/plan/specs/foundation.md §E)
- Remoto: https://github.com/RafaelPilartes/monorepo-portal_dos_interprete-ts (trabalho em `dev`; `main` não se toca)
- Estado: 95 testes unitários verdes; e2e 99/99 (as quatro apps); verify.py 6/6 (self-test 6/6); migrations 0; db:verify ainda não existe (passo F)
- Em aberto neste momento: nada
- Auto-decisões novas neste passo: AD-017
- Bloqueios: bundle do histórico antigo (AD-001); push de tags (correr scripts/release-tags.sh, AD-002)
- O que o Rafael pode ver no ecrã: `pnpm install && pnpm dev` → site 5170, solicitante 5171, intérprete 5172, equipa 5173 (sem login até ao H1/H2; ecrãs com dados fictícios).
- Ambiente: arrancar o `dockerd` à mão se `docker info` falhar; `docker build` precisa do CA do proxy (cabeçalho de apps/api/Dockerfile)
