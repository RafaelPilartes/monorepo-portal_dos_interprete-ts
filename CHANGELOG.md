# Changelog

Uma versão por passo do `docs/plan/MASTER-PLAN.md`. Uma só versão para todo o monorepo.

## 0.1.0 — 2026-10-25 — Passo B (Git do zero) e passo A (inventário)

- Passo A: mapa de rotas, componentes partilhados, segredos (nenhum encontrado) e mocks em `docs/inventory/05-route-map.md`; o explainer aponta para `docs/plan/decisions.md`.
- Passo B: `.gitattributes` com `eol=lf` (182 ficheiros normalizados de CRLF para LF), `.gitignore` alargado (`*.bundle`, credenciais de teste), `.env.example` com os nomes das variáveis, `CLAUDE.md` em modo contínuo.
- O repositório já tinha sido recomeçado sem histórico; o bundle do histórico antigo fica para o Rafael (AD-001). As tags são locais e recriadas por `scripts/release-tags.sh` (AD-002).
