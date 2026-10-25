# Spec — Dados pessoais (passos H2 e H14)

> Consentimento, quem vê os dados de quem, apagar a conta. Lei de referência: Lei n.º 22/11, de Protecção de Dados Pessoais (Angola). **Os textos legais não são escritos pelo Claude Code** (`PC-05`). Decisões: `D-55` a `D-58`. Objecções: `OB-02`, `OB-03`.

---

## Regras

**R-PRIV-01 — consentimento no registo (H2).** O registo mostra a versão publicada dos termos e da política de privacidade, com uma caixa **por marcar** que é obrigatória. `POST /auth/register` recebe os ids das versões mostradas e regista uma linha em `identity.consents` por documento, com data, IP e agente. Se o texto de um documento estiver vazio (`PC-05`), o registo funciona e o link mostra "Texto em preparação"; isto bloqueia a produção, não o desenvolvimento.

**R-PRIV-02 — nova versão (H2).** Publicar uma nova versão de um documento legal obriga todas as contas a aceitá-la. `GET /me` devolve `terms_acceptance_required` e a lista; o plugin `auth` da API responde `TERMS_ACCEPTANCE_REQUIRED` a qualquer rota excepto `/me` e `/me/accept-terms`, e as apps levam a `/accept-terms` até ser aceite. As contas são avisadas por email (`terms_updated`).

**R-PRIV-03 — apagar a conta, ou retirar o consentimento (H14).** São a mesma operação (`D-56`), pedida em `/settings` ("Apagar a minha conta", com a palavra-passe). `identity.request_account_deletion`:
- **recusa** (com a razão gravada e mostrada) se a conta tiver: um pedido não terminado como criador ou como intérprete aceite (`DELETION_BLOCKED_ACTIVE_REQUEST`); uma intenção `awaiting_proof` ou `proof_submitted`, um reembolso `pending` ou um repasse `queued` a seu favor (`DELETION_BLOCKED_PAYMENT`); ou ser `owner` de uma organização com outros membros activos (`LAST_OWNER`);
- senão, anonimiza **na mesma transacção** (`identity.anonymize_account`):
  - `profiles`: `full_name = 'Conta removida'`, `phone`, `avatar_path` a `NULL`, `status = 'anonymized'`;
  - `interpreter_profiles` e `requester_profiles`: textos livres e contactos a `NULL`; o `slug` passa a `removido-<8 caracteres>`;
  - apaga: línguas, especialidades, serviços, disponibilidade, formação, experiência, certificações, vídeos, artigos, favoritos, dados bancários, perfil de mentor, convites;
  - apaga os ficheiros: fotografia, documentos de verificação, imagens do feed, anexos de tickets (a partir de `storage.objects` e do armazenamento);
  - apaga o texto pessoal que escreveu: nos pedidos que criou, `beneficiary_name`, `address` e `notes` a `NULL`; nas mensagens de chat e de tickets, o corpo passa a "[mensagem removida]"; em `testimonials`, `author_name` a "Anónimo"; no `notify.email_outbox`, o endereço e o conteúdo das linhas para o seu email; em `support.contact_messages` com o seu email, nome, email e texto;
  - mantém, sem nome: pedidos, atribuições, avaliações, intenções, reembolsos, os consentimentos;
  - mantém **tal como estão** (`D-96`): recibos, as cópias de dados bancários nos repasses, os comprovativos e a auditoria, porque são prova de dinheiro e de acções; só os vê a equipa financeira (ou o `super_admin`, na auditoria);
  - no Supabase Auth: email trocado por `removed+<id>@invalid`, palavra-passe aleatória, sessões revogadas, utilizador bloqueado;
  - sendo o único membro de uma organização, a organização passa a `anonymized` (nome "Organização removida", NIF mantido para os recibos já emitidos).
- `anonymized` é final. O email fica livre para um registo novo.

**R-PRIV-04 — quem vê o quê.** A única definição é a das políticas em `data-model.md`. Em resumo, para a política de privacidade e para os testes:

| Dado | Quem vê |
|---|---|
| Nome e fotografia | qualquer conta activa; o visitante só os dos intérpretes listados |
| Telefone, WhatsApp e redes do intérprete | qualquer conta activa (`D-51`, `OB-01`) |
| Telefone e morada do solicitante | o próprio, a equipa, e intérpretes aceites num pedido dele (a morada do serviço) |
| Beneficiário de um pedido | criador, organização, intérpretes aceites, equipa (`R-REQ-07`) |
| Mensagens de um pedido | os participantes; a equipa pela API, com cada leitura auditada (`D-58`, `OB-02`) |
| Documentos de verificação | o próprio, `moderator`, `super_admin`, com cada abertura auditada |
| Comprovativos e recibos | o pagador, `owner`/`admin` da organização pagadora, `finance` |
| IBAN do intérprete | o próprio, `finance` |
| Avaliações feitas a solicitantes | intérpretes com um pedido dele (`D-44`) |

**R-PRIV-05 — leitura de conversas pela equipa.** A equipa não tem leitura directa de `booking.messages` na base. Lê por `GET /admin/threads/:id/messages`, que regista cada chamada em `audit.events` (`action = 'thread.read'`, com o pedido e o fio). Permitido a qualquer momento (`D-58`); a auditoria permite responder a "quem leu a minha conversa?".

---

## Ecrãs

- **Registo e `/accept-terms`:** `accounts-and-organizations.md`.
- **`/settings` (todas as apps):** "Os meus consentimentos" (versões aceites e datas), "Apagar a minha conta" com a explicação do que desaparece e do que fica sem nome, a confirmação com palavra-passe, e, se recusado, a razão e o que fazer ("Termina ou cancela o pedido PI-2026-000123 primeiro").
- **`admin-web` — ficha de conta:** o estado `anonymized` com a data; nenhum dado pessoal.

---

## Casos-limite

- **Retirar o consentimento a meio de um pedido:** recusado; a pessoa tem de terminar ou cancelar o pedido antes. A mensagem diz qual.
- **Um intérprete com repasse em fila pede para apagar:** recusado até o repasse ser pago; a mensagem diz que o pagamento está a ser processado.
- **Uma conta anonimizada tinha avaliações dadas:** ficam, com o autor "Conta removida", e continuam a contar na média.
- **Publicar uma versão nova da política enquanto alguém está a meio do assistente de pedido:** o envio falha com `TERMS_ACCEPTANCE_REQUIRED`; a app guarda o rascunho do assistente no navegador, leva a `/accept-terms` e volta ao assistente.

---

## Critérios de aceitação

1. Um registo sem a caixa marcada devolve `TERMS_NOT_ACCEPTED`; com ela, há duas linhas em `consents`.
2. Publicar uma nova versão faz `GET /me` devolver `terms_acceptance_required` e qualquer outra rota `TERMS_ACCEPTANCE_REQUIRED`.
3. Pedir para apagar com um pedido aceite para amanhã é recusado com a razão.
4. Depois de anonimizar: nenhuma coluna de texto livre ou contacto da conta tem o valor antigo (teste que procura o nome, o email e o telefone antigos em todas as tabelas de `identity`, `directory`, `booking`, `community`, `support` e `notify`, e em `billing` **excepto** `receipts`, `payouts` (cópia bancária) e comprovativos, e excepto `audit`, que mantêm os valores por `D-96`); os ficheiros desapareceram do armazenamento, menos os comprovativos; os pedidos e recibos continuam lá.
5. Ler um fio pela API do admin cria `thread.read` na auditoria; uma leitura directa da tabela com a sessão de um `moderator` devolve zero linhas.
