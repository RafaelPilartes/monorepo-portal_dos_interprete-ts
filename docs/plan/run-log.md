# Registo da corrida

> Uma linha por passo, acrescentada no fim de cada passo e nunca reescrita (`claude-code-rules.md` §10).

| Data | Passo | Versão | Testes | O que o revisor apanhou | Auto-decisões |
|---|---|---|---|---|---|
| 2026-10-25 | A + B | v0.1.0 | sem testes (só documentação e higiene de Git); `git ls-files \| grep -E '(^\|/)\.env$'` vazio | sem revisão independente: nenhum código mudou (só fins de linha e documentação) | AD-001 a AD-006 |
| 2026-10-25 | C | v0.2.0 | 17 testes em 14 pacotes; verify.py 5/5; self-test 5/5; docker build ok | 17 achados (14 confirmados): cache do Turborepo, buracos do verify.py, regra do Supabase no ESLint, hook pre-push; corrigidos (ver step-reports/C.md) | AD-007, AD-008 |
