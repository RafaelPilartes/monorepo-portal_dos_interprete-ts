# Spec — Formação e mentoria (passo H18)

> Decisões: `D-74`, `D-75`.

---

## Formação

**R-CRS-01 — catálogo de cursos com links.** Um `moderator` gere cursos: título, fornecedor (por omissão "Academia Grace Mind"), descrição, link externo (`https://`), capa, etiquetas, activo. Os intérpretes veem os activos e abrem o link noutra janela. **O Portal não gere inscrições, presenças nem conclusões** (`D-74`); a prova da formação para o selo continua a ser um documento carregado na verificação (`D-40`).

### Ecrãs

- **`interpreter-web` — `/training`:** cartões com filtro por etiqueta, e uma nota a ligar ao selo: "A formação da Academia é um dos requisitos do selo de verificação." **Vazio:** "Ainda não há cursos publicados."
- **`admin-web` — `/community/training`:** CRUD.

---

## Mentoria

**R-MEN-01 — ser mentor.** Só intérpretes com **selo activo** (`BADGE_REQUIRED`) criam o perfil de mentor (áreas, apresentação, activo). Perder o selo desactiva o perfil de mentor; as mentorias activas continuam até ao fim. Um mentor tem no máximo `mentorship_max_per_mentor` mentorias activas.

**R-MEN-02 — pedir e aprovar.** Um intérprete pede mentoria a um mentor activo, com mensagem. Não pode pedir a si próprio, nem ter outro pedido ou mentoria activa com o mesmo mentor (`MENTORSHIP_EXISTS`); o mentor tem de ter vaga (`MENTOR_FULL`, contado também na aprovação). O mentor e a equipa são avisados. Um `moderator` aprova (→ `approved`, as duas partes são avisadas e passam a ver os contactos um do outro) ou recusa com motivo.

**R-MEN-03 — terminar.** Qualquer das partes, ou a equipa, termina uma mentoria `approved`, com motivo (→ `ended`).

Não há dinheiro na mentoria. A comunicação entre mentor e mentorado faz-se fora do Portal, pelos contactos (o chat do Portal é só de pedidos, `D-52`).

### Ecrãs

- **`interpreter-web` — `/mentorship`:** "Mentores" (lista com áreas e vagas, "Pedir mentoria"), "As minhas mentorias" (como mentor e como mentorado), "Ser mentor" (só com selo; sem selo, a explicação e o link para a verificação).
- **`admin-web` — `/community/mentorship`:** pedidos por aprovar, mentorias activas, histórico.

---

## Critérios de aceitação

1. Um intérprete sem selo activo recebe `BADGE_REQUIRED` ao criar o perfil de mentor.
2. Com o mentor no máximo, pedir devolve `MENTOR_FULL`, e aprovar um pedido antigo também falha.
3. Os contactos do mentor só aparecem ao mentorado depois da aprovação. *(No Portal os contactos dos intérpretes já são visíveis a quem tem conta, `D-51`; a mentoria acrescenta o email do mentorado ao mentor.)*
4. Os cursos aparecem só a intérpretes, só os activos.
