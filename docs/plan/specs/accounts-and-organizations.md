# Spec — Contas, papéis e organizações (passo H2)

> Registo, entrada, papéis, troca de app, organizações com membros, suspensão. Decisões: `D-01`, `D-02`, `D-04`, `D-05`, `D-06`, `D-42`. O consentimento está em `personal-data.md`, mas o ecrã de registo é este.

---

## Regras

**R-ACC-01 — o registo cria uma conta, não um papel.** `POST /auth/register` cria o utilizador no Supabase Auth (que envia o email de confirmação) e regista a aceitação dos documentos legais (`R-PRIV-01`). O gatilho `identity.handle_new_auth_user` cria **só** `identity.profiles`. O papel é criado depois de o email estar confirmado, por `POST /onboarding/requester`, `POST /onboarding/interpreter` ou `POST /organizations`. O `intended_role` escolhido no registo só decide para onde o ecrã leva a pessoa a seguir. *(Corrige o defeito do inventário em que o papel enviado no registo era ignorado em silêncio.)*

**R-ACC-02 — o papel resolve-se, nunca se pergunta.** `GET /me` devolve os papéis que a conta tem: `requester` se tiver `requester_profiles` ou for membro activo de uma organização; `interpreter` se tiver `interpreter_profiles`; o nível de equipa se tiver `staff_members` activo. Dono: `auth_helper` + `GET /me`.

**R-ACC-03 — só contas activas.** Uma conta `suspended` ou `anonymized` não usa nada: `auth_helper.account_id()` devolve `NULL` (a RLS nega tudo) e a API responde `ACCOUNT_SUSPENDED`. Uma organização `suspended` não cria pedidos, mas os seus membros continuam a entrar e a ver o histórico.

**R-ACC-04 — troca de papel.** Quem tem os dois papéis troca no cabeçalho; `POST /me/active-role` guarda `last_active_role` e devolve o URL da app desse papel. Depois do login, a pessoa vai para a app de `last_active_role`, ou, sem ele, para a do único papel que tem, ou, sem papel nenhum, para o onboarding.

**R-ACC-05 — suspensão.** `POST /admin/accounts/:id/suspend` (`moderator`), com motivo obrigatório. Na mesma transacção (`identity.suspend_account`, `D-42`):
- o perfil passa a `suspended`; as sessões existentes deixam de funcionar no próximo pedido (a RLS e a API verificam o estado em cada chamada);
- o intérprete sai do directório (`directory.listed_interpreters`);
- **intérprete suspenso** (`D-90`): todas as suas atribuições `invited`, `applied` e `accepted` cujo serviço ainda não começou passam a `cancelled` (`cancelled_by_role = 'staff'`, sem cancelamento tardio). O lugar reabre como num cancelamento do intérprete (`R-LIFE-02`): no gerido pago, a equipa procura substituto e só sem substituto há reembolso (`R-MAN-07`);
- **solicitante suspenso** (`D-90`): todos os pedidos **criados** por ele que ainda não começaram passam a `cancelled`; nos geridos pagos, reembolso **total** (`reason_code = 'suspension'`, `R-PAY-09`); nas intenções por pagar, `billing.cancel_intent_for_subject`;
- a outra parte de cada pedido afectado é avisada (`account_suspended_counterparty`);
- os serviços já em curso ou passados mantêm-se, para não apagar histórico nem repasses.

Suspender uma organização faz aos pedidos dela o mesmo que a suspensão de um solicitante, sem suspender as contas dos membros. Dono: `identity.suspend_organization`.

**R-ACC-06 — reactivação.** `POST /admin/accounts/:id/reactivate` e `POST /admin/organizations/:id/reactivate` voltam a `active`. Nada do que foi cancelado volta.

**R-ORG-01 — criar organização.** Qualquer conta activa cria uma organização com nome e NIF (`util.nif`, único). Quem cria fica `owner`. Criar uma organização dá à conta o papel de solicitante, no contexto dessa organização. Dono: `identity.create_organization`.

**R-ORG-02 — convites.** `owner` e `admin` convidam por email, com papel `admin` ou `member`. O convite expira ao fim de `org_invite_expiry_days`. Só uma conta com **esse email exacto** o aceita (`INVITE_EMAIL_MISMATCH`). Um email sem conta recebe um link de registo que, depois da confirmação, aceita o convite. Revogar, expirar e aceitar são finais. Dono: `identity.create_invite`, `identity.accept_invite`, `identity.expire_org_invites`.

**R-ORG-03 — um só dono.** Uma organização tem sempre exactamente um `owner` activo. Só o `owner` muda papéis. Transferir a posse passa o actual a `admin` na mesma transacção. Dono: restrição única parcial + `identity.transfer_ownership`. Erro: `LAST_OWNER`.

**R-ORG-04 — sair ou ser removido.** `owner`/`admin` removem membros; qualquer membro sai sozinho; o `owner` só sai depois de transferir a posse. **Os pedidos criados por quem sai continuam a ser da organização** e passam a ser acompanhados pelos `owner`/`admin`. Os pedidos que a pessoa criou como particular continuam dela.

**R-ORG-05 — quem vê o quê numa organização.** Todos os membros activos veem todos os pedidos da organização. Criar pedidos directos e abertos: qualquer membro. Pedidos geridos: qualquer membro cria, mas precisam de aprovação (`R-MAN-01`). Aprovar, pagar, gerir membros e editar a organização: `owner` e `admin`.

---

## Ecrãs

### Páginas de entrada (`packages/auth`, montadas em `requester-web`, `interpreter-web` e `admin-web`)

- **`/register`**: nome, email, palavra-passe (com indicação das regras), "Vou usar o Portal para…" (Preciso de intérpretes / Sou intérprete / Represento uma empresa), caixa por marcar "Li e aceito os Termos e a Política de Privacidade" com os dois links (abrem a versão em vigor; se o texto estiver vazio, "Texto em preparação"). Botão desactivado até tudo estar válido. Depois: "Enviámos um email para {email}. Abre-o para confirmar a conta."
- **`/verify-email`**: destino do link do email; confirma e leva ao onboarding do papel escolhido.
- **`/login`**: email e palavra-passe, "Esqueci-me da palavra-passe", "Criar conta". Respeita `?returnTo=` (só caminhos internos; um URL externo é ignorado). Erros: credenciais erradas ("Email ou palavra-passe errados" — nunca diz qual), email por confirmar (com "Reenviar email"), conta suspensa.
- **`/recover-password`** e **`/reset-password`**: pedir o link e definir a nova palavra-passe. Pedir o link responde sempre o mesmo, exista ou não a conta.
- **`/accept-terms`**: aparece quando `GET /me` diz `terms_acceptance_required` (`R-PRIV-02`).
- **`/invite/:token`**: mostra a organização e o papel; "Aceitar" (com sessão do email certo) ou "Entrar"/"Criar conta".

### Onboarding

- **Solicitante particular:** cidade, morada e NIF opcionais. Pode saltar.
- **Intérprete:** cria o papel e leva ao perfil (`interpreter-profile-and-directory.md`), com a lista do que falta para aparecer no directório.
- **Empresa:** nome, NIF, sector, morada, cidade, telefone, site.

### Cabeçalho (todas as apps autenticadas)

Nome, fotografia, troca de papel (só se tiver os dois), contexto da organização em `requester-web` ("A pedir como: Particular / {Organização}"), notificações, sair (chama `signOut` e limpa o cookie).

### `requester-web` — `/organization`, `/organization/members`

- Dados da organização (editáveis por `owner`/`admin`).
- Membros: nome, email, papel, desde. Acções conforme `R-ORG-03` e `R-ORG-04`.
- Convites pendentes: email, papel, expira em; revogar.
- **Vazio** (sem convites): "Ainda não convidaste ninguém." **Erro:** mensagem do catálogo no campo certo.

### `admin-web` — `/requesters`, `/requesters/:id`, `/organizations`, `/organizations/:id`, `/interpreters`, `/interpreters/:id`

- Listas paginadas no servidor, com pesquisa e filtro por estado.
- Ficha: dados, papéis, organizações, pedidos, avaliações recebidas, cancelamentos tardios, estado. Botão "Suspender" (motivo obrigatório, e a lista do que vai ser cancelado antes de confirmar) ou "Reactivar".

---

## Casos-limite

- **Registo com um email já registado:** `EMAIL_IN_USE`, no campo do email. *(O Supabase pode esconder esta informação por segurança; a API devolve o mesmo erro em ambos os casos.)*
- **Abrir `/invite/:token` com a sessão de outro email:** "Este convite foi enviado para {email mascarado}. Sai e entra com esse email."
- **Duas pessoas a aceitar o mesmo convite:** impossível, porque o email é bloqueado.
- **O `owner` apaga a conta:** recusado enquanto for `owner` de uma organização com mais membros (`R-PRIV-03`); sendo o único membro, a organização passa a `anonymized` com a conta.
- **Uma conta suspensa com sessão aberta noutra app:** o pedido seguinte falha com `ACCOUNT_SUSPENDED` e a app leva à página "Conta suspensa", com o contacto do suporte.
- **Um intérprete que também é membro de uma organização:** não é elegível para os pedidos dessa organização (`D-93`, `R-DIR-09`); não os vê nos abertos nem pode ser convidado.

---

## Critérios de aceitação

1. Um registo cria `identity.profiles` e nenhum papel; o papel só aparece depois do onboarding.
2. `returnTo=https://outro-site.com` é ignorado; `returnTo=/interpreters/maria-santos` leva lá depois do login.
3. Uma conta com os dois papéis troca de app sem voltar a fazer login (cookie partilhado).
4. Remover o único `owner` falha com `LAST_OWNER`.
5. Suspender um intérprete com um pedido aceite para amanhã cancela a atribuição, avisa o solicitante e tira o intérprete do directório, tudo na mesma transacção (teste: forçar um erro a meio e confirmar que nada mudou). *No H2 testa-se só a saída do directório; a parte dos pedidos fecha no H8 e a do gerido pago no H11 (`MASTER-PLAN.md`).*
6. Uma conta suspensa recebe `ACCOUNT_SUSPENDED` em qualquer rota e lê zero linhas por RLS.
7. Um pedido criado por um membro que é depois removido continua visível para o `owner`.
