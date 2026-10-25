# Spec — Perfil do intérprete e directório (passo H4)

> O que o intérprete mostra de si, quem o vê, e como aparece no directório. Decisões: `D-03`, `D-05`, `D-17`, `D-45`, `D-51`.

---

## Regras

**R-DIR-01 — perfil completo.** Um perfil está completo quando tem, ao mesmo tempo:
- biografia com pelo menos 80 caracteres;
- modalidade (`online`, `in_person` ou `both`);
- pelo menos uma língua;
- pelo menos um serviço activo com preço;
- cidade, se a modalidade incluir presencial.

Dono: `directory.is_profile_complete`. O ecrã mostra a lista do que falta, lida desta função (nunca uma cópia da regra no ecrã).

**R-DIR-02 — slug.** Gerado no onboarding a partir do nome (minúsculas, sem acentos, hífenes), com sufixo numérico se já existir. Não muda depois, para não partir links. Dono: `identity.become_interpreter`.

**R-DIR-03 — quem aparece no directório.** Perfil completo, conta `active`. Dono: vista `directory.listed_interpreters`. A verificação não é condição (`D-41`).

**R-DIR-04 — quem vê o perfil.**
- Visitante anónimo: só a vista `directory.public_listing` (nome, fotografia, cidade, línguas, especialidades, modalidade, selo, avaliação média e número de avaliações). Carregar no cartão leva ao login com `returnTo` (`D-05`).
- Qualquer conta activa: o perfil completo, **incluindo** telefone, WhatsApp e redes sociais (`D-51`, objecção `OB-01`), serviços e preços, taxa de deslocação, percurso, conteúdo, disponibilidade, avaliações reveladas e o número de cancelamentos tardios.
- Perfis incompletos ou de contas suspensas: só o dono e a equipa.

**R-DIR-05 — avaliação média.** Calculada sobre as avaliações reveladas e não escondidas, nunca guardada numa coluna. Dono: vista `directory.interpreter_ratings`. Sem avaliações mostra "Ainda sem avaliações", nunca "0,0".

**R-DIR-06 — cancelamentos tardios.** O perfil mostra "Cancelamentos tardios: N nos últimos 12 meses" quando N > 0. Dono: vista `directory.late_cancellations`.

**R-DIR-07 — conteúdo publica logo.** Vídeos e artigos ficam `published` ao gravar (`D-45`). Os vídeos são links externos (YouTube, Vimeo); o Portal não aloja vídeo. A equipa remove com motivo (`directory.remove_content`), o autor é avisado (`content_removed`) e a remoção fica na auditoria. O autor não volta a publicar o mesmo item: cria um novo.

**R-DIR-08 — disponibilidade.** Regras semanais (dia, hora de início, hora de fim, em hora de Luanda) e dias bloqueados. **É indicativa:** um pedido fora da disponibilidade é permitido, com aviso a quem pede e a quem recebe. O que impede de verdade é a sobreposição (`R-REQ-05`).

**R-DIR-09 — elegibilidade para um pedido.** Um intérprete é elegível para um pedido quando: aparece no directório (`R-DIR-03`); tem **todas** as línguas do pedido; tem o serviço do pedido activo no seu perfil; a modalidade é compatível; não é o criador do pedido nem membro da organização que o criou (`D-93`). Dono: `directory.is_eligible_for`, que devolve também o motivo em português quando não é (por exemplo, "não interpreta Kimbundu").

**R-DIR-10 — favoritos.** Um solicitante marca e desmarca intérpretes como favoritos. Só ele vê os seus favoritos.

---

## Ecrãs

### `interpreter-web` — `/profile` e sub-rotas

- **`/profile`**: estado do perfil — "Visível no directório" ou "Ainda não visível: falta {lista}", com links para cada secção; pré-visualização "Ver como os outros me veem" (abre `/interpreters/:slug`).
- **`/profile/overview`**: fotografia, biografia (contador de caracteres), anos de experiência, modalidade, cidade, tarifa mínima por hora, aceita negociar, taxa de deslocação (`D-17`).
- **`/profile/experience`**: formação, experiência e certificações (CRUD real, a substituir o CRUD em memória de hoje).
- **`/profile/services`**: línguas com nível; especialidades; serviços do catálogo com o preço do intérprete. O modo de preço vem do serviço ("por hora" ou "fixo").
- **`/profile/content`**: vídeos (link, título, descrição, etiquetas) e artigos (editor simples, capa). Itens removidos aparecem com "Removido pela equipa: {motivo}".
- **`/profile/reviews`**: avaliações recebidas e reveladas; as que aguardam revelação aparecem como "1 avaliação por revelar".
- **`/profile/contact`**: telefone, WhatsApp, site e redes, com o aviso "Visível a qualquer pessoa com conta no Portal."
- **`/availability`**: grelha semanal e calendário de dias bloqueados.
- **Estados:** cada secção com esqueleto a carregar, mensagem de vazio própria ("Ainda não acrescentaste formação"), e erro por campo ao gravar.

### `packages/features` — perfil público (`/interpreters/:slug`, `/videos`, `/articles`, `/articles/:articleSlug`)

Montado em `requester-web` e `interpreter-web`. Mostra o que `R-DIR-04` permite. Botões: "Pedir este intérprete" (em `requester-web`, abre o assistente de pedido com o intérprete escolhido), "Favorito", "Denunciar" (nos vídeos e artigos). Slug inexistente: página "Este intérprete não existe ou já não está disponível."

### `site-web` — `/interpreters`

Lista pública (vista `directory.public_listing`), com pesquisa por nome e filtros por língua, especialidade, modalidade, cidade e "só verificados" (este último só a partir do H12, quando existe o selo). Paginação no servidor. **Vazio:** "Nenhum intérprete encontrado com estes filtros." O cartão leva ao login com `returnTo`.

### `requester-web` — `/interpreters`, `/favorites`

A mesma pesquisa, com o perfil completo ao abrir. Favoritos com "Remover".

---

## Casos-limite

- **O intérprete remove a última língua:** deixa de estar completo e sai do directório. Os pedidos já aceites mantêm-se; não recebe convites novos.
- **Uma língua desactivada no catálogo:** continua no perfil, mas não conta para elegibilidade em pedidos novos.
- **Link de vídeo que não é YouTube nem Vimeo:** aceite como link simples, sem incorporação.
- **Fotografia acima de 2 MB ou de tipo errado:** recusada no upload com `FILE_INVALID`.
- **Dois intérpretes com o mesmo nome:** slugs `maria-santos` e `maria-santos-2`.

---

## Critérios de aceitação

1. Um intérprete com todos os campos de `R-DIR-01` menos o serviço não aparece em `directory.listed_interpreters`; acrescentar o serviço fá-lo aparecer sem mais nada.
2. Um pedido anónimo à vista `public_listing` não devolve `contact_phone`; um pedido autenticado ao perfil devolve-o.
3. Um intérprete suspenso não aparece em nenhuma das vistas do directório.
4. `directory.is_eligible_for` devolve falso com o motivo para cada uma das cinco condições de `R-DIR-09` (cinco testes).
5. Remover um artigo pela equipa esconde-o de todos menos do autor e da equipa, e cria uma entrada na auditoria e uma notificação ao autor.
6. Abrir `/interpreters/:slug` sem sessão leva ao login e volta ao mesmo perfil depois.
