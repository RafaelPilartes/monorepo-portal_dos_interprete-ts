# Plano mestre — Portal dos Intérpretes

> A ordem de execução, passo a passo, para o Claude Code correr do princípio ao fim sem parar (`claude-code-rules.md`). Cada passo é uma fatia que funciona de ponta a ponta antes de começar a seguinte: base, API e ecrãs juntos. **Nunca todas as tabelas primeiro e todos os ecrãs depois.**
>
> Antes de começar, ler: `claude-code-rules.md` (como se trabalha), `decisions.md` (o que está decidido), `architecture.md`, `data-model.md`, `api.md`, e a spec do passo.

---

## Como ler um passo

- **Objectivo** — duas ou três linhas.
- **Spec** — o ficheiro que o detalha; as regras e os critérios de aceitação estão lá.
- **Depende de** — passos que têm de estar fechados.
- **Feito quando** — verificável por teste ou verificação. Todos os passos H têm também os **portões comuns** (abaixo).
- **Testa no fim** — o que o Claude Code corre e mostra no relatório.
- **Versão** — a tag com que o passo fecha (`claude-code-rules.md` §6, alínea f).

### Portões comuns a todos os passos H

1. As migrations novas aplicam-se de raiz com `pnpm db:verify` (base limpa, seis fases, tipos regenerados iguais, asserções verdes).
2. Cada regra `R-…` do passo tem pelo menos um teste (asserção SQL ou teste de integração da API). Os **testes de comportamento** (o que a regra faz) têm de falhar contra o commit anterior. As **verificações estruturais** (`verify.py`, `grep` no código) não podem falhar antes, porque o código ainda não existe: provam-se com um ficheiro de violação deliberada em `scripts/fixtures/`, que a verificação tem de apanhar.
3. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `python3 scripts/verify.py` verdes.
4. O fluxo principal do passo corre no browser contra a base local, por Playwright, com capturas de ecrã guardadas em `docs/plan/evidence/<passo>/` (um ficheiro por ecrã, com o estado vazio, a carregar, de erro e de sucesso quando o passo os tem). **Funcionar nos testes não chega: tem de ser visto no ecrã.**
5. Nenhum ecrã do passo mostra dados de mocks: os mocks que o passo substitui são apagados.
6. As notificações que o passo cria estão no catálogo (`specs/notifications.md`) e cada uma tem um teste que a faz disparar, **no próprio passo** (`notifications.md`, critério 4); o passo Z só confirma que nenhum código ficou sem teste.
7. Se o passo acrescenta dados pessoais, `identity.anonymize_account` e o seu teste (`R-PRIV-03`, critério 4) são estendidos no mesmo passo.
8. Revisão independente feita, e o que foi confirmado corrigido (`claude-code-rules.md` §6, alínea e).
9. `HANDOFF.md`, `CHANGELOG.md` e `docs/plan/run-log.md` actualizados; tag criada.

---

## Grafo

```
A ─ B ─ C ─ D1 ─ D2 ─ D3 ─ D4 ─ E ─ F ─ G ─ H1 ─┬─ H2 ─┬─ H4 ─ H5 ─┬─ H6 ─ H7
                                                │      │           ├─ H8 ─ H9
                                                └─ H3 ─┘           │
                                                                   └──────────┐
H2 ─ H10 (pagamentos) ─┬─ H11 (gerido; precisa de H6 e H8) ◄──────────────────┘
                       ├─ H12 (verificação; precisa de H4)
                       └─ H17 (eventos pagos)
H5…H12 ─ H13 (operações) ─ H14 (apagar conta)
H2 ─ H15 (suporte)
H4 ─ H16 (fórum e feed)
H12 ─ H18 (mentoria) ─ H19 (benefícios, biblioteca)
tudo ─ Z (fecho)
```

A ordem linear abaixo respeita o grafo.

---

## Fundação

| | Passo | Spec | Depende | Feito quando | Testa no fim | Versão |
|---|---|---|---|---|---|---|
| **A** | Inventário só de leitura: confirmar `docs/inventory/`, mapa de rotas para as apps novas, segredos no código, mocks, actualizar o explainer | `specs/foundation.md` §A | — | `docs/inventory/05-route-map.md` cobre todas as páginas; segredos listados por nome; explainer aponta para `decisions.md` | nada a correr; o relatório lista as divergências | sem tag (entra no commit de B) |
| **B** | Git do zero: bundle do histórico, repositório novo em `dev`, `.gitignore`, `.gitattributes`, `.env.example`, `CLAUDE.md` actualizado | §B | A | bundle existe com tamanho > 0; nenhum `.env` versionado | `git ls-files`, tamanho do bundle | `v0.1.0` |
| **C** | Monorepo vazio a compilar: pnpm + Turborepo, quatro apps e API vazias, `packages/*`, `verify.py`, hook `pre-push`, ADRs, Dockerfile | §C | B | `pnpm build`, `typecheck`, `lint` passam; as cinco arrancam; `docker build` termina | os comandos acima, saída em bruto | `v0.2.0` |
| **D1** | Mover o `site-web` | §D | C | todas as rotas do site do mapa abrem sem erros, iguais a hoje; 404 em português | Playwright percorre as rotas e captura cada uma | `v0.3.0` |
| **D2** | Mover o `admin-web` | §D | D1 | idem, rotas do admin | idem | `v0.4.0` |
| **D3** | Mover o `requester-web` | §D | D2 | idem, rotas do solicitante | idem | `v0.5.0` |
| **D4** | Mover o `interpreter-web`; apagar `src/` antigo | §D | D3 | idem; `src/` já não existe | idem | `v0.6.0` |
| **E** | Pacotes partilhados: `ui`, `i18n`, `core`, `auth`, `data`, `features` | §E | D4 | nenhum componente duplicado entre apps (`verify.py`); testes de `core` e `i18n` | testes unitários | `v0.7.0` |
| **F** | Base local: CLI do Supabase como dependência, scripts com `trap` e verificação de disco, migration `0001-foundation`, asserções, tipos gerados | §F | E | `pnpm db:verify` passa de raiz; Ctrl+C a meio deixa zero contentores | `db:verify`, `docker ps -a` depois de interromper | `v0.8.0` |
| **G** | API: env, plugins, catálogo de erros, `/health`, worker de email, ficheiros assinados | §G | F | testes de integração da API passam; email enfileirado chega ao servidor local | `pnpm --filter @portal/api test` | `v0.9.0` |

## Funcionalidades

| | Passo | Spec | Depende | Feito quando (além dos portões comuns) | Testa no fim | Versão |
|---|---|---|---|---|---|---|
| **H1** | Equipa, configuração versionada, auditoria; login do `admin-web` (só email e palavra-passe; o registo é do H2); script de arranque que, na base local, cria também o utilizador no Auth (`R-STF-03`) | `staff-and-config.md` | G | critérios 1 a 8 da spec; o admin entra e publica uma versão no ecrã | asserções de `R-STF-*`, `R-CFG-*`, `R-AUD-*`; Playwright: login do admin → publicar configuração → ver na auditoria | `v0.10.0` |
| **H2** | Contas, papéis, troca de app, organizações e convites, suspensão; consentimento no registo e nova versão dos termos (`R-PRIV-01`, `R-PRIV-02`) | `accounts-and-organizations.md`, `personal-data.md` §R-PRIV-01/02 | H1 | critérios das duas specs (só `R-PRIV-01/02`; o critério 5 de contas só na parte do directório, porque ainda não há pedidos); guardas de rota em todas as apps; **esqueleto** de `identity.anonymize_account` e do seu teste, só com `identity` (o portão 7 estende-o a cada passo; o H14 liga-o ao ecrã) | Playwright: registo → confirmação no email local → onboarding → troca de papel → criar organização → convidar → aceitar | `v0.11.0` |
| **H3** | Catálogos e página de serviços real | `catalogs.md` | H1 | critérios 1 a 4 | asserções de `R-CAT-*`; Playwright: admin cria serviço → aparece em `/services` | `v0.12.0` |
| **H4** | Perfil do intérprete, disponibilidade, conteúdo, directório público e com sessão, favoritos | `interpreter-profile-and-directory.md` | H2, H3 | critérios 1 a 6 | asserções `R-DIR-*`; Playwright: intérprete completa o perfil → aparece no site → visitante é levado ao login → volta ao perfil | `v0.13.0` |
| **H5** | Núcleo dos pedidos + pedido directo + chat + sino de notificações | `requests-core.md`, `requests-direct.md`, `notifications.md` | H4 | critérios das três specs | Playwright: solicitante cria directo → intérprete aceita → os dois conversam no chat → ambos veem `confirmed` | `v0.14.0` |
| **H6** | Negociação | `negotiation.md` | H5 | critérios 1 a 5 | Playwright: proposta → contraproposta → aceitar → intérprete aceita o pedido ao preço negociado | `v0.15.0` |
| **H7** | Pedido aberto, nos dois modos | `requests-open.md` | H6 | critérios 1 a 4, incluindo o teste concorrente | Playwright: os dois modos de ponta a ponta | `v0.16.0` |
| **H8** | Cancelar, marcar como feito, confirmar, confirmação automática, disputas; a cascata da suspensão sobre atribuições e pedidos (`R-ACC-05`, critério 5 de contas) | `service-lifecycle.md` | H5 | critérios 1 a 5 (o 6 precisa do gerido e fecha no H11); critério 5 de contas completo | Playwright: feito → confirmado; disputa → resolvida no admin | `v0.17.0` |
| **H9** | Avaliações dupla-cegas | `reviews.md` | H8 | critérios 1 a 5 | Playwright: as duas partes avaliam e veem ao mesmo tempo | `v0.18.0` |
| **H10** | Pagamentos: intenções, comprovativos, validação, reembolsos, repasses, recibos | `payments.md` | H2 | critérios 1 a 7 (o fluxo visto com uma intenção de teste criada por fixture) | asserções `R-PAY-*`; Playwright: enviar → recusar → reenviar → aceitar → recibo | `v0.19.0` |
| **H11** | Pedido gerido | `requests-managed.md` | H6, H8, H10 | critérios 1 a 6; critério 6 de `service-lifecycle.md`; suspensão num gerido pago (`D-90`) com teste nos dois sentidos | Playwright nas três apps: criar → aprovar (org) → orçamento → aceitar → atribuir → intérprete aceita → pagar → validar → feito → confirmar → repasse pago | `v0.20.0` |
| **H12** | Verificação e selo; o filtro "só verificados" do directório (`R-DIR-*`), que não aparece antes deste passo | `verification.md` | H4, H10 | critérios 1 a 7 | Playwright: documentos → submeter → pagar → validar pagamento → aprovar → selo no perfil | `v0.21.0` |
| **H13** | Operações da equipa: painel, filas, relatórios, exportações, conteúdo do site, vídeos LGA | `admin-operations.md` | H5 a H12 | critérios 1 a 5 | Playwright: painel com contadores → relatório vazio e com dados → exportação | `v0.22.0` |
| **H14** | Apagar conta / retirar consentimento; leitura de conversas auditada | `personal-data.md` §R-PRIV-03 a 05 | H13 | critérios 3 a 5 da spec | teste de anonimização que procura dados antigos em todas as tabelas; Playwright: pedido recusado com a razão → resolvido → conta apagada | `v0.23.0` |
| **H15** | Suporte e formulário de contacto | `support.md` | H2 | critérios 1 a 5 | Playwright: contacto no site → admin converte em ticket → resposta → utilizador vê | `v0.24.0` |
| **H16** | Fórum, feed, denúncias, moderação; `admin-web` `/content/reports` (fila de denúncias) | `community-forum-feed.md` | H4 | critérios 1 a 5 | Playwright: tópico → resposta → solução; publicação no feed vista pelo solicitante; 3 denúncias escondem | `v0.25.0` |
| **H17** | Bolsa de oportunidades e eventos | `community-opportunities-events.md` | H10, H2 | critérios 1 a 5 | Playwright: organização publica → intérprete candidata-se → contratado; evento pago com comprovativo | `v0.26.0` |
| **H18** | Formação (links) e mentoria | `community-training-mentoring.md` | H12 | critérios 1 a 4 | Playwright: verificado torna-se mentor → pedido → aprovado | `v0.27.0` |
| **H19** | Biblioteca, apoio jurídico e ético, benefícios e parcerias | `community-library-benefits.md` | H12 | critérios 1 a 4 | Playwright: verificado vê benefícios; não verificado vê a explicação | `v0.28.0` |

## Fecho

| | Passo | Feito quando | Versão |
|---|---|---|---|
| **Z** | `docs/testing/MANUAL-TEST-PLAN.md` (os testes no ecrã para o Rafael, por app, com o passo exacto e o resultado esperado, e uma secção "o que já se sabe que não funciona"); `docs/plan/run-report.md` (`claude-code-rules.md` §8); lista final do que bloqueia a produção, a partir de `decisions.md` §13 e de `auto-decisions.md`; `CLAUDE.md` com o estado final | os três documentos existem e cada passo do plano tem uma linha no relatório | `v0.29.0` |

---

## O que quebra a sequência

Se acontecer, o Claude Code **não pára**: escolhe a versão mais segura, regista em `auto-decisions.md` e continua (`claude-code-rules.md` §3).

1. Um passo precisa de algo de um passo posterior → implementa o mínimo necessário dentro do passo actual, regista, e o passo posterior completa-o.
2. Uma regra de uma spec contradiz outra, ou contradiz `decisions.md` → vale `decisions.md`; entre duas specs, vale a mais restritiva para o dinheiro e os dados das pessoas; regista a contradição.
3. Uma migration aplicada a precisar de mudança → migration nova, nunca editar a antiga.
4. Um bloqueio do "O que não dobra" → salta o passo, regista, segue para o seguinte que não dependa dele.
