# Spec — Catálogos (passo H3)

> Línguas, especialidades e serviços. São a base do directório, dos pedidos e dos preços do gerido. Decisões: `D-18`.

---

## Regras

**R-CAT-01 — desactivar, não apagar.** Um item usado por algum perfil, serviço de intérprete, pedido ou oportunidade **não se apaga**: desactiva-se. Um item desactivado deixa de aparecer nas escolhas novas, mas continua a mostrar-se onde já foi usado. Apagar só é possível se nunca foi usado. Dono: `catalog.guard_delete` (gatilho `BEFORE DELETE`).

**R-CAT-02 — o modo de preço não muda depois de usado.** O `pricing_mode` (`hourly`, `fixed`) de um serviço não muda se houver algum `directory.interpreter_services` ou pedido com esse serviço, porque os preços dos intérpretes deixariam de fazer sentido. Para mudar, cria-se um serviço novo e desactiva-se o antigo. Dono: gatilho `catalog.guard_service_pricing_mode`.

A regra do preço é `R-REQ-02`, em `requests-core.md`; os catálogos só fornecem `pricing_mode` e `platform_price_aoa`.

---

## Seed

- **Línguas:** LGA (Língua Gestual Angolana, `is_sign_language = true`), Português, Inglês, Francês, Espanhol, Kimbundu, Umbundu, Kikongo, Cokwe.
- **Especialidades:** saúde, justiça, educação, eventos, conferências, empresarial, religioso, comunicação social.
- **Serviços:** a partir dos mocks de `Services.tsx` e `AdminServices.tsx`, cada um com `pricing_mode` e `platform_price_aoa` fictícios, marcados no seed como fictícios.

---

## Ecrãs

### `admin-web` — `/catalog/languages`, `/catalog/specialties`, `/catalog/services`

- Tabela com nome, código ou slug, activo, ordem, e "Usado em N sítios".
- Criar e editar num painel lateral, com validação no campo (código único, slug no formato `util.slug`).
- Serviços: título, descrição, modo de preço (bloqueado se usado, com a explicação de `R-CAT-02`), preço de tabela (com o sufixo "por hora" ou "fixo"), ícone, activo.
- "Apagar" só aparece em itens nunca usados; nos outros, "Desactivar".
- **Vazio:** "Ainda não há {línguas}." **A carregar** / **erro:** como sempre.

### `site-web` — `/services`

Os serviços activos com descrição e preço de tabela ("a partir de {preço} por hora" ou "{preço}"), vindos da base em vez do array escrito na página. O modal de detalhe mantém-se.

---

## Casos-limite

- **Desactivar uma língua que um intérprete tem no perfil:** continua no perfil dele, marcada "(já não disponível para novos pedidos)"; o intérprete pode removê-la mas não voltar a acrescentá-la.
- **Mudar o preço de tabela de um serviço:** vale para orçamentos novos; os pedidos geridos já orçados mantêm o seu `managed_unit_price_aoa`.

---

## Critérios de aceitação

1. `DELETE` de um serviço usado falha na base; a API devolve `IN_USE` ("Este item já foi usado. Desactiva-o em vez de o apagar.")
2. Mudar o `pricing_mode` de um serviço com `interpreter_services` falha na base.
3. Um serviço desactivado não aparece no assistente de pedido nem em `/services`, mas aparece no detalhe de um pedido antigo.
4. `site-web/services` mostra os dados do seed, sem nenhum array escrito na página.
