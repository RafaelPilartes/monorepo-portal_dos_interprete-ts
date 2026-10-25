# Spec — Verificação e selo da Academia (passo H12)

> O selo que diz que o intérprete foi formado pela Academia Grace Mind e cumpre o código de ética. Opcional, pago, anual. Decisões: `D-34`, `D-35`, `D-40`, `D-41`, `D-57`. Pendentes: `PC-03`, `PC-07`.

---

## Regras

**R-VER-01 — um pedido de cada vez.** Um intérprete tem no máximo um pedido de verificação em `draft`, `awaiting_payment`, `under_review` ou `needs_changes` (`VERIFICATION_OPEN_EXISTS`). O tipo é `first` se nunca teve selo, `renewal` se tem ou teve. Dono: `verification.create_request`. O próprio cancela em `draft`, `awaiting_payment` (a intenção viva é cancelada, `R-PAY-06`) ou `needs_changes` (sem reembolso); depois de pagar e antes de uma decisão, só a equipa cancela, e decide se há reembolso manual. Dono: `verification.cancel`.

**R-VER-02 — documentos.** Carregam-se por URL assinado (finalidade `verification_document`; PDF, JPG ou PNG até 10 MB), um ou mais por tipo. Para submeter, tem de haver pelo menos um documento de cada tipo `required` e `active` (`REQUIRED_DOCUMENTS_MISSING`, com a lista do que falta). Tipos: `config.verification_document_types` (`PC-07`), incluindo obrigatoriamente o certificado da formação da Academia (`D-40`). Removem-se documentos só em `draft` e `needs_changes`.

**R-VER-03 — pagar.** Submeter grava no pedido a versão de configuração em vigor (`config_version_id`, `R-CFG-03`) e cria a intenção com `verification_fee_aoa` dessa versão (sem valor publicado, `CONFIG_VALUE_MISSING`, `PC-03`), com `due_at = agora + verification_payment_deadline_days`, e passa o pedido a `awaiting_payment`. Pagamento confirmado → `under_review` e aviso aos moderadores. Intenção expirada → volta a `draft`. Dono: `verification.submit`.

**R-VER-04 — decidir.** Um `moderator` revê cada documento (`accepted`/`rejected`, com nota) e decide o pedido, com notas obrigatórias:
- `approve`: exige todos os obrigatórios `accepted`; cria o selo (`R-VER-06`);
- `needs_changes`: indica o que corrigir; o intérprete corrige e volta a submeter (`R-VER-05`);
- `reject`: final; reembolso pela política (`R-PAY-08`).
O intérprete é avisado (`verification_decided`) com as notas. Um moderador que seja o próprio intérprete não decide. Dono: `verification.decide`.

**R-VER-05 — correcções.** Em `needs_changes`, o intérprete troca documentos e volta a submeter **sem pagar outra vez**, até `verification_free_resubmissions` vezes (`RESUBMISSIONS_EXHAUSTED`). Esgotadas, tem de começar um pedido novo (e pagar). Dono: `verification.resubmit`.

**R-VER-06 — o selo.** A aprovação cria `verification.badges` com `valid_from = max(agora, validade do selo activo)` e `valid_until = valid_from + verification_validity_months` (uma renovação aprovada antes do fim não perde dias). Um selo está activo quando `valid_until > agora` e não foi revogado. Dono: vista `directory.interpreter_badges` e `auth_helper.has_active_badge`. O selo aparece no perfil, na lista do directório e no filtro "só verificados".

**R-VER-07 — renovação.** `verification_renewal_notice_days` antes do fim, o intérprete é avisado (`badge_expiring`) com "Renovar". Expirado, o selo desaparece sozinho (pela vista; não há tarefa a apagar nada).

**R-VER-08 — revogar.** Um `moderator` revoga um selo activo com motivo (por exemplo, falta ética comprovada). Fica na auditoria; o intérprete é avisado. Não há reembolso.

**R-VER-09 — privacidade dos documentos.** Os documentos veem-nos o próprio e `moderator`/`super_admin` (`D-57`). A equipa abre-os por `GET /files/url`, que regista cada abertura na auditoria. Guardam-se enquanto a conta existir e apagam-se na anonimização (`R-PRIV-03`). *(Objecção `OB-03`.)*

---

## Ecrãs

- **`interpreter-web` — `/verification`:** o que é o selo e o que exige (texto e espaço para vídeo LGA), o preço da taxa vindo da configuração ("Por definir" se vazio, com o botão desactivado), o estado do selo (activo até {data} / expirado / nunca), e o pedido em curso: documentos por tipo com upload, o bloco de pagamento (`payments.md`), as notas da decisão, "Submeter", "Voltar a submeter" (com "{N} correcções gratuitas restantes"), "Cancelar". Histórico de pedidos anteriores.
- **`admin-web` — `/verifications`:** fila `under_review` (mais antigos primeiro) com o número de dias à espera. **`/verifications/:id`:** dados do intérprete, os documentos (abrir regista na auditoria), revisão por documento, decisão com notas. **`/verifications/history`:** decididos, com quem e quando. **Vazio:** "Não há verificações por analisar."

---

## Casos-limite

- **Documento obrigatório desactivado entre a submissão e a decisão:** a decisão usa os tipos activos no momento da decisão.
- **O intérprete é suspenso com uma verificação `under_review`:** o pedido fica em espera; a equipa decide ou cancela (sem reembolso automático; um reembolso manual é possível).
- **Renovação aprovada com o selo ainda activo por 20 dias:** o novo selo começa no fim do actual.

---

## Critérios de aceitação

1. Submeter sem o certificado da Academia devolve `REQUIRED_DOCUMENTS_MISSING` com esse tipo na lista.
2. Sem taxa publicada, submeter devolve `CONFIG_VALUE_MISSING`.
3. Aprovar sem todos os obrigatórios aceites é recusado.
4. Duas correcções com `verification_free_resubmissions = 1`: a segunda devolve `RESUBMISSIONS_EXHAUSTED`.
5. Recusar com a política a 50 % cria um reembolso de metade da taxa, arredondado para baixo.
6. Um selo com `valid_until` ontem não aparece no perfil, e o intérprete deixa de ver os benefícios (`R-BEN-01`).
7. Abrir um documento pela equipa cria uma entrada na auditoria.
