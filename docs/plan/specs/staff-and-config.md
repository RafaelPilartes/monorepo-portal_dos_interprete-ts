# Spec — Equipa, configuração e auditoria (passo H1)

> Antes de alguém usar o Portal, a equipa tem de existir, a configuração tem de estar publicada e a auditoria tem de registar tudo. Decisões: `D-60` a `D-63`.

---

## Regras

**R-STF-01 — níveis e o que cada um pode.** Quatro níveis (`D-60`). A matriz abaixo é a única definição; `auth_helper.is_staff(levels)` aplica-a nas políticas e o plugin `staff` da API nas rotas. `super_admin` pode sempre tudo.

| Área | `super_admin` | `moderator` | `finance` | `request_operator` |
|---|---|---|---|---|
| Equipa (criar, mudar nível, desactivar) | ✓ | | | |
| Configuração, documentos legais | ✓ | | | |
| Catálogos (línguas, especialidades, serviços), tipos de documento | ✓ | ✓ | | |
| Contas e organizações (ver, suspender, reactivar) | ✓ | ✓ | ver | ver só intérpretes |
| Pedidos: ver | todos | todos | todos | só geridos |
| Pedidos: cancelar, resolver disputas | ✓ | ✓ | | cancelar só geridos |
| Pedidos geridos: orçamento, negociação, atribuição | ✓ | ✓ | | ✓ |
| Ler conversas de pedidos (`D-58`) | ✓ | ✓ | | ✓ (só geridos) |
| Verificações: decidir, revogar selos | ✓ | ✓ | | |
| Pagamentos: validar comprovativos, reembolsos, repasses | ✓ | | ✓ | |
| Conteúdo do site e da comunidade, denúncias, avaliações | ✓ | ✓ | | |
| Relatórios: visão geral (`/reports`) | ✓ | ✓ | ✓ | ✓ |
| Relatórios: pedidos | ✓ | ✓ | | só geridos |
| Relatórios: pagamentos | ✓ | | ✓ | |
| Relatórios: verificações | ✓ | ✓ | | |
| Exportações CSV (`D-61`) | ✓ | | ✓ | |
| Auditoria | tudo | as suas áreas | as suas áreas | as suas áreas |
| Suporte (tickets, contacto) | ✓ | ✓ | ✓ | ✓ |
| Emails falhados (ver, reenviar) | ✓ | | | |

**R-STF-02 — sempre um `super_admin`.** Não se pode desactivar nem baixar de nível o último `super_admin` activo. Dono: `identity.set_staff_member`. Erro: `LAST_SUPER_ADMIN`.

**R-STF-03 — arranque.** O primeiro `super_admin` não se cria pelo ecrã: cria-o `packages/db/scripts/bootstrap-admin.mjs`, que recebe um email, cria a linha em `identity.staff_members` e publica a primeira versão de configuração a partir do rascunho do seed. **Na base local** (e só lá; o script recusa outro URL), se a conta não existir, cria-a no Auth com o email confirmado e uma palavra-passe aleatória, que escreve em `docs/technical/TEST-CREDENTIALS.md` (no `.gitignore`). Os testes Playwright leem esse ficheiro em tempo de execução; o Claude Code não o abre nem o imprime (`claude-code-rules.md` §1). Em produção, a conta tem de existir antes (registo normal). Corre-se uma vez por ambiente; correr outra vez não muda nada.

**R-CFG-01 — uma versão em vigor.** Existe sempre exactamente uma versão `published` de `config.platform_versions` (restrição única parcial). Publicar uma nova passa a anterior a `retired`, na mesma transacção. Dono: `config.publish_version`.

**R-CFG-02 — publicar não é editar.** Só os rascunhos se editam. Uma versão publicada ou retirada é imutável (`util.forbid_mutation`). Para mudar um valor cria-se um rascunho a partir da versão em vigor, edita-se e publica-se. Publicar fica na auditoria com o valor antes e depois de cada campo alterado.

**R-CFG-03 — cada coisa guarda a sua versão.** Pedidos, intenções de pagamento e pedidos de verificação guardam o `config_version_id` em vigor quando foram criados, e **todas as regras que dependem deles leem essa versão**, não a actual. Dono da versão actual: `config.current_version_id()`.

**R-CFG-04 — valor em falta bloqueia, não inventa.** Se uma operação precisa de um valor de configuração vazio (por exemplo, `verification_fee_aoa` sem valor da Academia), recusa com `CONFIG_VALUE_MISSING`. Nunca usa um valor por omissão escondido. Dono: `config.require`.

**R-CFG-05 — formatos em dois sítios, verificados.** O NIF, o telefone e o IBAN angolano vivem como domínio na base (`util.nif`, `util.phone_e164`, `util.iban_ao`) e como expressão em `@portal/core`, porque o formulário precisa de os validar antes de enviar. São a **única excepção** à regra de um sítio só, e `scripts/verify.py` compara as duas expressões literalmente e falha se divergirem.

**R-AUD-01 — auditoria imutável.** `audit.events` não aceita `UPDATE` nem `DELETE` de ninguém, incluindo `service_role` (gatilho `util.forbid_mutation` + privilégios revogados).

**R-AUD-02 — o que se regista.** Toda a acção da equipa (pela API) e toda a mudança de estado (pelas funções de transição), com quem, quando, o quê, valor antes e depois, IP e `request_id`. Também: cada leitura de conversa pela equipa (`R-PRIV-05`), cada abertura de documento de verificação pela equipa (`R-VER-09`), cada exportação (`R-ADM-03`). Dono: `audit.record`.

**R-AUD-03 — o que cada nível vê na auditoria.** `super_admin` tudo; os outros só as entradas das suas áreas (vista `audit.events_for_staff`, pela matriz de `R-STF-01`).

---

## Ecrãs (`admin-web`)

### `/login`

Email e palavra-passe (`packages/auth`). Uma conta sem linha activa em `identity.staff_members` entra e vê "Esta área é só para a equipa do Portal", com um link para a app do seu papel.

### `/team`

- Lista de membros: nome, email, nível, activo, criado por, desde.
- "Adicionar membro": email de uma conta **já registada** (pesquisa por email exacto) e nível. Se o email não existir: "Não há nenhuma conta com este email. A pessoa tem de se registar primeiro."
- Mudar nível, desactivar e reactivar, com confirmação.
- **Vazio:** impossível (há sempre um `super_admin`). **A carregar:** esqueleto da tabela. **Erro:** mensagem do catálogo e botão "Tentar outra vez".

### `/settings/config`

- Versão em vigor, só de leitura, agrupada por tema: pedidos, cancelamento e conclusão, avaliações, gerido, verificação, eventos, impostos, dados bancários da Academia, outros.
- Campos vazios que bloqueiam a produção aparecem marcados: "Por definir — bloqueia a produção".
- "Criar rascunho" a partir da versão em vigor; editar o rascunho com validação no campo; "Publicar" mostra a lista de diferenças para a versão em vigor e pede confirmação.
- Histórico de versões com quem publicou e quando.
- **Vazio:** nunca (o seed cria a primeira versão). **Erro ao publicar:** a mensagem e o campo.

### `/settings/legal`

Versões dos termos e da política de privacidade. Editor de texto (Markdown), pré-visualização, publicar. Uma versão publicada avisa: "Todas as contas vão ter de aceitar esta versão no próximo acesso."

### `/settings/document-types`

Lista editável dos tipos de documento da verificação (`PC-07`): nome, descrição, obrigatório, activo, ordem.

### `/audit`

- Lista paginada no servidor, mais recente primeiro: quando, quem (nome e nível), acção, entidade, resumo.
- Filtros: período, pessoa, acção, tipo de entidade.
- Detalhe: o JSON antes e depois, lado a lado.
- **Vazio** (num filtro): "Não há registos neste período." **A carregar** / **erro:** como acima.

---

## Casos-limite

- **Dois `super_admin` a publicar ao mesmo tempo:** a segunda publicação encontra a versão em vigor diferente da que esperava (`expected_current_version_id` enviado pela API) e falha com `STATE_CHANGED`.
- **Publicar um rascunho criado a partir de uma versão que já não está em vigor:** permitido, mas o ecrã de diferenças compara com a versão em vigor, não com a de origem.
- **Desactivar um membro da equipa com tickets atribuídos:** os tickets ficam sem responsável e voltam à fila geral.
- **Um membro da equipa que também é intérprete:** pode, mas **não decide nada sobre si próprio** (verificação, pagamento, disputa). As funções de decisão recusam com `FORBIDDEN` quando o decisor é parte.

---

## Critérios de aceitação

1. Com a base acabada de montar e o script de arranque corrido, existe um `super_admin` e uma versão de configuração publicada. Correr o script outra vez não cria duplicados.
2. Um `moderator` que chama `POST /admin/config/versions` recebe `403 FORBIDDEN`.
3. Publicar uma versão nova deixa exactamente uma `published`; a anterior fica `retired`; um `UPDATE` directo numa versão `published` falha na base.
4. Desactivar o último `super_admin` falha com `LAST_SUPER_ADMIN`.
5. `UPDATE audit.events …` e `DELETE FROM audit.events …` falham com `service_role`.
6. Um pedido criado antes de uma mudança de configuração continua a usar os prazos da versão em que foi criado (teste em `requests-core`).
7. Uma operação que precisa de um valor vazio falha com `CONFIG_VALUE_MISSING` (teste em `verification` e `requests-managed`).
8. `verify.py` falha se `NIF_PATTERN` em `@portal/core` mudar sem `util.nif` mudar.
