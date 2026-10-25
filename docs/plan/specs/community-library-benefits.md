# Spec — Biblioteca, apoio jurídico e ético, benefícios e parcerias (passo H19)

> Decisões: `D-76`, `D-78`.

---

## Biblioteca e apoio jurídico e ético

**R-LIB-01 — recursos para ler.** Um `moderator` publica recursos em duas secções: `library` (guias, modelos, perguntas frequentes) e `legal` (legislação, código de ética, modelos de contrato, perguntas frequentes jurídicas). Cada recurso tem título, resumo, corpo em Markdown e/ou um ficheiro (bucket `library`, PDF até 20 MB), e `published`. Os intérpretes veem os publicados; o ficheiro abre por URL assinado. **Sem pedidos de apoio** (`D-76`): para uma dúvida concreta, o ecrã aponta para o suporte (`support.md`) com a categoria `other`.

O código de ética da Academia é o recurso que o selo invoca (`D-40`); o seed cria-o **vazio**, como os textos legais (`PC-05`), e o ecrã mostra "Em preparação".

### Ecrãs

- **`interpreter-web` — `/library` e `/library/legal`:** lista por tipo, pesquisa, detalhe com o corpo e "Descarregar". **Vazio:** "Ainda não há recursos nesta secção."
- **`admin-web` — `/community/library`:** CRUD, publicar e despublicar.

---

## Benefícios e parcerias

**R-BEN-01 — só verificados.** Parceiros e benefícios são visíveis **apenas a intérpretes com selo activo** (`D-78`; política com `auth_helper.has_active_badge(auth_helper.account_id())`) e à equipa. Um intérprete sem selo vê, no lugar da lista, a explicação "Os benefícios são exclusivos de intérpretes verificados pela Academia" e o link para a verificação. Quando o selo expira, deixa de os ver.

**R-BEN-02 — gerir.** Um `moderator` gere parceiros (nome, logótipo, site, descrição, activo) e benefícios (parceiro, título, descrição, código, percentagem de desconto opcional, condições, válido de/até, activo). Um benefício fora da validade ou de um parceiro inactivo não aparece.

### Ecrãs

- **`interpreter-web` — `/benefits`:** cartões por parceiro com o código para "Copiar" e as condições.
- **`admin-web` — `/community/partners`:** CRUD de parceiros e benefícios.

---

## Critérios de aceitação

1. Um intérprete sem selo lê zero benefícios por RLS; com selo activo, lê os válidos.
2. Um benefício com `valid_until` ontem não aparece.
3. Um solicitante lê zero recursos da biblioteca.
4. O código de ética aparece como "Em preparação" enquanto o corpo estiver vazio.
