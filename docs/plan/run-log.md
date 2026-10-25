# Registo da corrida

> Uma linha por passo, acrescentada no fim de cada passo e nunca reescrita (`claude-code-rules.md` §10).

| Data | Passo | Versão | Testes | O que o revisor apanhou | Auto-decisões |
|---|---|---|---|---|---|
| 2026-10-25 | A + B | v0.1.0 | sem testes (só documentação e higiene de Git); `git ls-files \| grep -E '(^\|/)\.env$'` vazio | sem revisão independente: nenhum código mudou (só fins de linha e documentação) | AD-001 a AD-006 |
| 2026-10-25 | C | v0.2.0 | 17 testes em 14 pacotes; verify.py 5/5; self-test 5/5; docker build ok | 17 achados (14 confirmados): cache do Turborepo, buracos do verify.py, regra do Supabase no ESLint, hook pre-push; corrigidos (ver step-reports/C.md) | AD-007, AD-008 |
| 2026-10-25 | D1 | v0.3.0 | 28 unitários em 14 pacotes; e2e 12/12; verify.py 6/6; self-test 6/6 | 12 achados (10 confirmados): dependência site→features sem registo, regra de dependências sem verificação, e2e com texto do cabeçalho, SEO perdido, falta de testes; corrigidos (step-reports/D1.md) | AD-009 a AD-013 |
| 2026-10-25 | D2 | v0.4.0 | 37 unitários em 14 pacotes; e2e 43/43; verify.py 6/6; self-test 6/6 | 6 achados menores (sem bloqueio): link de registo no login do admin, testes em falta, dependências não usadas, textos genéricos no e2e; corrigidos (step-reports/D2.md) | AD-014 |
| 2026-10-25 | D3 | v0.5.0 | 42 unitários em 14 pacotes; e2e 66/66; verify.py 6/6; self-test 6/6 | 7 achados de gravidade baixa: separadores do perfil a sair do ecrã, testes em falta, comportamentos antigos sem registo; corrigidos ou registados (step-reports/D3.md) | AD-015, AD-016 |
| 2026-10-25 | D4 | v0.6.0 | 95 unitários em 14 pacotes; e2e 99/99; verify.py 6/6; self-test 6/6 | 10 achados (sem bloqueio): /interpreters em falta no interpreter-web, estado não listado com estilo e rótulo errados, registo pré-seleccionado errado, README desactualizado; corrigidos ou registados (step-reports/D4.md) | AD-017 |
| 2026-10-25 | E | v0.7.0 | 177 unitários em 14 pacotes; e2e 99/99; verify.py 8/8; self-test 8/8 | 17 achados (2 altos: cookie de sessão acima do limite do browser, mensagens com {placeholders}; 9 médios); corrigidos (step-reports/E.md) | AD-018 a AD-021 |
