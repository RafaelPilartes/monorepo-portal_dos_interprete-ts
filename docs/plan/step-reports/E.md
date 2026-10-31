# Relatório do passo E — pacotes partilhados (v0.7.0, 2026-10-25)

## O que mudou
- `core`: padrões (`PHONE_E164`, `NIF`, `IBAN_AO`, `EMAIL`) iguais aos domínios SQL de `data-model.md`; `normalizePhone` (só números angolanos de 9 dígitos recebem +244, AD-020); esquemas zod com as mensagens do catálogo; catálogo de erros gerado de `api.md` §2, com parâmetros (`{min}`…).
- `i18n`: `formatAoa` ("14 040 Kz", só inteiros seguros), datas e horas em `Africa/Luanda`, textos comuns.
- `ui`: `StatusBadge` deixa de rebentar com estados desconhecidos (`04-gaps.md` item 7); `MoneyAmount` (diz "Valor indisponível" em vez de rebentar), `FileUpload`, `PaginationBar`; a fonte passa a carregar.
- `data`: `DataError` com códigos do catálogo; `ReadOnlyDAO` e `BaseSupabaseDAO` multi-schema; `SessionDAO`; `ApiClient` com o JWT, idempotência e erros sempre do catálogo.
- `auth`: cookie do domínio-pai em pedaços que cabem no limite do browser (ADR-007), sessão com fonte injectável, e as guardas `RequireSession`, `RequireRole`, `RequireStaffLevel`.
- `verify.py`: `error-catalog` e `no-duplicated-component` (8 verificações).

## Prova — saída em bruto dos portões
```
Done in 1.9s using pnpm v10.28.0
 Tasks:    5 successful, 5 total
 Tasks:    15 successful, 15 total
 Tasks:    15 successful, 15 total   (lint --force, after fixing a precision-loss literal in a test)
config:test: # pass 2
api:test:       Tests  4 passed (4)
i18n:test:       Tests  11 passed (11)
db-types:test:       Tests  1 passed (1)
db:test:       Tests  1 passed (1)
core:test:       Tests  24 passed (24)
data:test:       Tests  20 passed (20)
ui:test:       Tests  11 passed (11)
features:test:       Tests  3 passed (3)
auth:test:       Tests  20 passed (20)
site-web:test:       Tests  5 passed (5)
requester-web:test:       Tests  14 passed (14)
admin-web:test:       Tests  25 passed (25)
interpreter-web:test:       Tests  33 passed (33)
 Tasks:    14 successful, 14 total
verify.py: 8/8 checks passed
self-test: 8/8 checks behave
  99 passed (2.2m)
```
Testes de comportamento novos (passam aqui; em v0.6.0 não existiam os módulos, por isso falham lá [INFERIDO, não corrido]): 24 em `core`, 11 em `i18n`, 11 em `ui`, 20 em `data`, 20 em `auth`.

## Revisão independente
17 achados (2 altos, 9 médios, 6 baixos). Todos os confirmados foram corrigidos:
- **Altos:** o cookie da sessão podia passar o limite do browser depois da codificação, e a pessoa saía da sessão sem aviso (agora codifica-se primeiro e corta-se sem partir um `%XX`; testado com acentos e aspas, cada cookie < 4096 bytes); as mensagens com parâmetros chegavam ao ecrã com `{min}` (agora preenchem-se).
- **Médios:** um 2xx que não é JSON contava como sucesso; 403/404/429 sem corpo davam `INTERNAL_ERROR`; uma leitura de sessão antiga podia repor a sessão depois de sair (corrida); uma falha a ler a sessão aparecia como "não tem sessão" (agora estado `error` com mensagem); `signOut` ignorava o erro; um cookie estranho mal formado partia a leitura; fixos angolanos viravam outro país (AD-020); mensagens copiadas à mão ou em inglês; `RequireStaffLevel` não exigia o papel `staff`.
- **Baixos:** valores fora dos inteiros seguros; o detector de componentes duplicados falhava com imports em várias linhas e `export default`; a verificação do catálogo passava sem `api.md` e podia perder linhas; o tempo real não avisava eliminações nem `TIMED_OUT`; JWT expirado do PostgREST dava a mensagem errada.
- Registados (AD-021): sítio do cliente Supabase; conflito entre `claude-code-rules.md` §9 e `architecture.md` §6 sobre onde vive o catálogo; o `returnTo` tem de ser validado no H2.

## O que não foi verificado
- Comportamento real do cookie em browsers e subdomínios (só em testes com um `document.cookie` simulado).
- A comparação dos padrões com os domínios `util.*` (R-CFG-05) entra no passo F, quando a migração existir.
