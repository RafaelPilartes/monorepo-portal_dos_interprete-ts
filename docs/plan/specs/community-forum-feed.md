# Spec — Fórum, feed e moderação (passo H16)

> O espaço da comunidade de intérpretes. Decisões: `D-45`, `D-77`.

---

## Regras

**R-FOR-01 — fórum só para intérpretes.** Ler e escrever no fórum exige o papel de intérprete e conta activa (políticas com `auth_helper.is_interpreter()`). Categorias geridas pela equipa (seed: Geral, Dicas e técnica, Carreira, Ética e legal, LGA).

**R-FOR-02 — tópicos e respostas.** O autor cria um tópico (título até 150 caracteres, corpo até 10 000) numa categoria activa e responde a tópicos. Num tópico `is_locked` não há respostas novas (`TOPIC_LOCKED`, verificado na política de inserção). A equipa fixa e fecha tópicos (`POST /admin/forum/topics/:id/pin`, `…/lock`).

**R-FOR-03 — editar e apagar.** O autor edita o seu tópico ou resposta (marcado "editado" com `edited_at`) e "apaga" (passa a `removed` com a nota "Removido pelo autor"; a linha fica, para não partir a conversa). A equipa remove com motivo (`R-COM-02`).

**R-FOR-04 — solução.** O autor do tópico marca uma resposta como solução (uma por tópico; muda-se marcando outra). Dono: `community.mark_solution`.

**R-FEED-01 — publicar no feed.** Só intérpretes publicam: texto até 2 000 caracteres e uma imagem opcional (JPG, PNG ou WebP até 5 MB, bucket `feed-images`). **Qualquer conta activa vê** o feed (`D-77`).

**R-FEED-02 — comentar e reagir.** Só intérpretes comentam e reagem (um "gosto" por pessoa por publicação). Os solicitantes veem publicações, comentários e contagens. *(Decisão do desenho, a partir de "os intérpretes publicam, todos com conta veem"; o Rafael pode alargar.)* Contagens por vista, nunca coluna.

**R-COM-01 — denúncias.** Qualquer conta activa denuncia uma publicação, comentário, tópico, resposta, artigo, vídeo ou avaliação, com motivo (`content_reports`; uma denúncia por pessoa por item). Com `content_reports_autohide_threshold` (3) denúncias abertas de pessoas diferentes, o item fica escondido automaticamente (`community.is_hidden_by_reports`) até a equipa decidir (o autor continua a vê-lo, com a nota "Em análise"). A equipa trata: `dismiss` (o item volta, se estava escondido) ou `remove`.

**R-COM-02 — remoção pela equipa.** Um `moderator` remove qualquer conteúdo com motivo. O item fica `removed` (só o autor e a equipa o veem, com o motivo), o autor é avisado (`content_removed`) e fica na auditoria. Dono: `community.remove_content` e `directory.remove_content`.

---

## Ecrãs

- **`interpreter-web` — `/community/forum`:** categorias com o número de tópicos e a última actividade; lista de tópicos (fixados primeiro), pesquisa; o tópico com respostas paginadas, a solução destacada, "Responder", "Denunciar". **Vazio:** "Ainda não há tópicos nesta categoria. Começa tu."
- **`interpreter-web` — `/community/feed`:** publicar (texto e imagem), lista paginada infinita, comentar, gostar, denunciar.
- **`requester-web` — `/feed`:** o mesmo, só leitura, com "Denunciar".
- **`admin-web` — `/community/forum`, `/community/feed`, `/content/reports`:** moderação; a fila de denúncias agrupada por item, com o número de denúncias, os motivos, o conteúdo, "Manter" e "Remover".

---

## Casos-limite

- **Um intérprete suspenso:** o seu conteúdo fica visível (não se apaga histórico), mas ele não escreve.
- **Conta anonimizada:** publicações e respostas ficam com "Conta removida"; as imagens do feed são apagadas (`R-PRIV-03`).
- **Denúncia do próprio conteúdo:** recusada.
- **O autor edita um item escondido por denúncias:** permitido; a denúncia continua aberta.

---

## Critérios de aceitação

1. Uma conta só solicitante lê zero tópicos do fórum por RLS e consegue ler o feed.
2. Uma resposta num tópico fechado é recusada pela base.
3. A terceira denúncia de pessoas diferentes esconde o item a todos menos o autor e a equipa.
4. Remover pela equipa cria a entrada na auditoria e a notificação ao autor.
5. Um solicitante não consegue comentar nem gostar (RLS).
