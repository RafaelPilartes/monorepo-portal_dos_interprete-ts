# Relatório do passo C — monorepo vazio a compilar (v0.2.0, 2026-10-25)

## O que mudou
- A SPA antiga passou, sem mudar conteúdo, para `legacy/` (420 renomeações a 100 %; só `legacy/package.json` mudou: nome e scripts) (AD-008).
- Raiz pnpm + Turborepo; `packages/config` (ESLint, tsconfig estrito, fábrica Vite com versão e commit, preset Tailwind com os tokens actuais); 8 pacotes vazios; 4 apps Vite + React com página "a arrancar" e versão no rodapé; API Fastify 5 com `GET /health` e Dockerfile.
- `scripts/verify.py` com 5 verificações (as 4 "desde C" e `single-version`), cada uma provada por `--self-test` contra uma fixture com violações e uma gémea limpa; `.githooks/pre-push`; ADR-001 a ADR-007; `scripts/set-version.py`.

## Prova — saída em bruto dos portões
```
Done in 1.8s using pnpm v10.28.0
 Tasks:    5 successful, 5 total
 Tasks:    14 successful, 14 total
 Tasks:    14 successful, 14 total
@portal-dos-interpretes/config:test: # pass 2
@portal-dos-interpretes/core:test:       Tests  1 passed (1)
@portal-dos-interpretes/i18n:test:       Tests  1 passed (1)
@portal-dos-interpretes/db-types:test:       Tests  1 passed (1)
@portal-dos-interpretes/db:test:       Tests  1 passed (1)
@portal-dos-interpretes/auth:test:       Tests  1 passed (1)
@portal-dos-interpretes/api:test:       Tests  4 passed (4)
@portal-dos-interpretes/features:test:       Tests  1 passed (1)
@portal-dos-interpretes/data:test:       Tests  1 passed (1)
@portal-dos-interpretes/ui:test:       Tests  1 passed (1)
@portal-dos-interpretes/site-web:test:       Tests  1 passed (1)
@portal-dos-interpretes/interpreter-web:test:       Tests  1 passed (1)
@portal-dos-interpretes/requester-web:test:       Tests  1 passed (1)
@portal-dos-interpretes/admin-web:test:       Tests  1 passed (1)
 Tasks:    14 successful, 14 total
verify.py: 5/5 checks passed
self-test: 5/5 checks behave
```
- `pnpm dev`: as quatro apps respondem 200 em 5170–5173 e `/health` em 3000.
- `docker build -f apps/api/Dockerfile .` termina (com o CA do proxy como segredo de build e `--network host`; a primeira tentativa levou 429 do Docker Hub); o contentor responde a `/health` com o commit.
- Teste de comportamento novo (`apps/api/src/routes/health.test.ts`): falhou antes da rota existir (404 em vez de 200) e passa depois [VISTO na corrida de 16:56].

## Revisão independente
Subagente sem participação no código; 17 achados, 14 CONFIRMADOS. Corrigidos:
1. Cache do Turborepo não invalidava `typecheck`/`lint`/`test` das apps quando um pacote mudava → `dependsOn: ["^…"]`; provado: uma prop obrigatória nova no `AppFooter` faz falhar as quatro apps com a cache quente.
2. `verify.py` cego depois de `'*'` num texto, `window.fetch`, `globalThis.fetch`, `.mts`, pastas `fixtures`, `.env.*`, identificadores acentuados, chaves inline, parâmetros, métodos e aliases → lexer único que sabe de strings e comentários; verificação de imports `@supabase/*` fora de `packages/data/src/dao/`; self-test com `expected.txt` exacto e gémea limpa.
3. ESLint bloqueava o Supabase também dentro de `src/dao/**` e deixava passar subcaminhos e `import()` dinâmico → `patterns`, `no-restricted-syntax` e excepção só para `src/dao/**`.
4. Hook `pre-push` bloqueava o push (pedia `db:verify` antes do passo F) e saltava `db:verify` em silêncio quando o intervalo era desconhecido → corre `db:verify` só quando os scripts existem; intervalo desconhecido conta como "mudou" com aviso; recusa correr com a árvore suja.
5. `/health` com `commit: "unknown"` em desenvolvimento → `resolveCommit()` com recurso ao git, com teste.
6. `packages/config` só tinha verificação de sintaxe → `tsc` com `checkJs`.
7. Teste da versão nas apps era circular → compara com o `package.json` da raiz.
8. Versão única só verificada para a API → verificação `single-version` em `verify.py`.
9. ADR com a primeira letra minúscula → corrigido.

Não corrigido, registado: `prepare` não consegue activar o hook fora de um repositório git (agora avisa em vez de calar); os `.d.ts` escritos à mão de `packages/config` continuam sem verificação automática contra o `.js` (o `checkJs` cobre o `.js`, não a correspondência).

## O que não foi verificado
- Comportamento noutra máquina que não esta VM (por exemplo `corepack` e IPv6).
