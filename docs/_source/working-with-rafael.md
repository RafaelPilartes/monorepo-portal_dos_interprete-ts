# Como o Rafael trabalha

> Junta dois briefings escritos a 2026-10-15 por Claudes que trabalharam com o Rafael noutros projectos: o **Dossier de Carreira** (recrutamento: seis apps web, API Fastify, Supabase) e o **Kandengue Atrevido** (transporte e entregas: duas apps móveis, admin, API Fastify, Firebase). Os dois projectos são só a origem das lições. Este documento é sobre a pessoa e o método.
>
> Lê-o como contexto, não como ordens. Onde alguma coisa daqui não servir ao Portal dos Intérpretes, diz-lhe porquê. Onde os dois briefings discordam, está na secção 9, por decidir.

---

## 1. Não há MVP: há fases completas e lançáveis

O Rafael não trabalha com MVP, e não é teimosia. Um MVP corta âmbito para chegar depressa, e o que se corta volta mais tarde como retrabalho: dados mal modelados, permissões improvisadas, fluxos refeitos. Ele prefere fazer bem à primeira, mesmo que custe mais no curto prazo.

"Sem MVP" não quer dizer "tudo de uma vez". Quer dizer o **âmbito completo, organizado em fases lançáveis**:

- **Cada fase é uma fatia inteira** que funciona de ponta a ponta e que o cliente consegue usar ou vender. Se uma fase entrega a gestão de pedidos, entrega-a toda: os estados, as permissões, os erros, a auditoria, o que acontece quando alguém cancela.
- **Não se corta o que o cliente pediu**, mesmo que pareça excesso. O trabalho é organizar o âmbito, não encolhê-lo. Se achares que uma parte não deve existir, diz porquê; a decisão é dele e do cliente.
- **O que se adia é a ordem, não a qualidade.** Uma coisa pode ficar para a fase 4, mas quando a fase 4 chega, chega completa.
- **O que se adia vai para uma fase com nome**, escrita no plano. Nunca para um "depois" vago.
- **A estrutura está completa desde o início** (schema, RLS, funções). Em cada fase entra a funcionar só o conteúdo dessa fase.

### Quando uma fase está fechada

No Dossier, o plano por fases existia, com uma pasta `docs/` cheia. As fases falharam na mesma: várias foram dadas por concluídas sem funcionarem de ponta a ponta. Os pagamentos nunca foram homologados, os emails nunca saíram, os trabalhos automáticos nunca correram porque a API não estava online. Seis blocos ficaram parciais e só se soube semanas depois.

A lição não é escrever mais documentos. Uma fase só está fechada quando:

- todas as decisões de produto estão tomadas, ou marcadas como abertas com quem decide;
- os contratos entre as partes (base de dados, API, apps) estão definidos;
- os casos-limite estão pensados: cancelamentos, concorrência, dados em falta, falhas de rede;
- funciona no ambiente real e foi visto no ecrã;
- há uma prova concreta disso fora dos testes (ver §5, prova em produção).

"O código existe e os testes passam" não chega. A definição de "feito" de cada fase diz isto à partida. Uma fase completa é a que não deixa perguntas para descobrir a meio da execução.

---

## 2. Quem faz o quê

- **O chat desenha e decide com ele.** Analisa a fundo, propõe, apanha erros de desenho e escreve as mensagens exactas para o Claude Code. Não executa.
- **O Claude Code executa.** Lê o código, faz inventários, escreve, testa, e faz deploy quando autorizado.
- **O Rafael decide e corre o que é sensível.** Palavras-passe, tokens e credenciais correm no terminal dele, nunca dentro do Claude Code.

O ciclo:

1. Ele dá o objectivo. O chat analisa o que depende do quê, o que pode partir e o que ainda não se sabe.
2. O chat escreve a mensagem para o Claude Code num bloco de código, com fases e pontos de paragem. As decisões de produto ficam marcadas para ele preencher, nunca assumidas: `[DECISÃO — proposta: …]`.
3. Ele manda, o Claude Code responde, ele cola a resposta no chat.
4. O chat avalia o que está certo, errado e em falta, e escreve a mensagem seguinte.
5. No fim de cada fase, o Claude Code escreve o estado num `HANDOFF.md`, para a sessão seguinte arrancar sem reler tudo.

As nove regras do método estão nas instruções do Projecto. O que os dois briefings acrescentam sobre a forma de comunicar:

- **Apontar incoerências, não resolvê-las em silêncio.** Ele quer saber quando a arquitectura, a UI ou uma resposta dele não batem certo.
- **Ideias próprias**, não reformulações do que ele disse.
- **Sem exagero.** Separar sempre o que **bloqueia** (tem evidência de dano e impede o uso real) do que é **melhoria**.
- **Não perder o fio.** Sempre que citares um código (defeito, achado, fase, decisão), diz entre parêntesis o que é, em cada menção. De vez em quando, um ponto de situação: onde estamos, o que falta, o que vem a seguir.
- **A voz dele.** Documentos para ele ou para o cliente são escritos de forma natural e directa, sem linguagem de empresa nem de IA.

---

## 3. Como um projecto se organiza

Antes de código de produção, oito etapas, desenhadas por ele:

1. Ler e descrever a visão: o que o produto é, para quem, e porquê.
2. Mapear o âmbito completo, sem cortar.
3. Decidir a arquitectura: monorepo ou não, como se dividem as apps, onde fica a API.
4. Avaliar riscos e viabilidade.
5. Modelação técnica: stack e modelo de dados.
6. Fases completas de entrega, com estimativa por fase.
7. Ordem de execução.
8. Proposta ao cliente.

O resultado vive numa pasta `docs/` com documentos reais do projecto, nunca modelos vazios: `analysis/`, `product/`, `architecture/`, `domain/`, `flows/`, `technical/`, `integrations/`, `infrastructure/`, `ui/`, `foundation/` e `decisions/`. A skill `project-documentation-architect` conduz a entrevista e gera a árvore.

A peça central é o **documento de produto em linguagem simples** (`docs/_source/product-explainer.md`): a fonte de verdade sobre o que o produto deve fazer, escrito para o cliente perceber. Quando o código e esse documento discordam, ou é defeito, ou é uma decisão a tomar e registar.

**Cada decisão consequente fica registada com o porquê** (um ADR em `docs/decisions/`), para ninguém a voltar a discutir sem saber a razão original.

Nomes de ficheiros e pastas sempre em inglês, mesmo com conteúdo em português.

---

## 4. A arquitectura que ele usa

Não é uma lei, mas é o padrão a que chegou nos dois projectos.

- **Monorepo com pnpm e Turborepo** quando há várias aplicações sobre os mesmos dados: **uma app por público**, uma API, e pacotes partilhados (`ui`, `auth`, `data`, `core`, `i18n`, `config`, `db`).
- **Camada de dados em Clean Architecture + MVVM**: Row → Entity → ViewModel, com DAO, UseCase e ViewModel. Há uma skill para isto (`clean-architecture-mvvm-data-layer`), com variantes para Supabase, Firebase e Fastify + Prisma. Nunca se escreve `supabase.from(...)` num componente.
- **Deploy da API no Railway com Dockerfile explícito.** Deixar a plataforma adivinhar como construir um monorepo custou três deploys falhados no Dossier.
- **Versões `0.MINOR.PATCH`**: o MINOR é a fase concluída, o PATCH são correcções dentro dela, o 1.0.0 é o lançamento com utilizadores reais. Cada versão leva tag anotada.
- **Passar uma app existente a monorepo é uma migração, não uma reescrita.** Começa por um inventário e só depois se propõe como separar.

### O servidor decide o que é sensível

É a lição mais cara dos dois projectos, e vale para qualquer um:

**Tudo o que decide dinheiro, identidade, permissões ou o estado de uma transacção passa pelo servidor. O cliente só escreve o que é dele, e não decide nada que outra pessoa vá pagar ou em que vá confiar.**

- **Kandengue:** os estados de uma corrida, os códigos de confirmação e até os tempos de espera cobrados eram escritos pelo telemóvel do motorista. Funcionava, mas qualquer app modificada podia mentir. Corrigir isso em produção custou semanas.
- **Dossier:** a API é uma porta entre várias; só a base de dados é atravessada por todas. Por isso a autorização vive na base: RLS em todas as tabelas, negar por omissão, permissões de escrita por coluna, e funções com privilégios controlados. Uma coluna com consequência (dinheiro, estado, pontuação, verificado) nunca se concede ao utilizador: escreve-a uma função do servidor.

A API (Fastify) fica com o que precisa da chave de serviço: pagamentos, webhooks, chamadas a modelos de linguagem, trabalhos agendados, e as transições de estado que outra pessoa vai pagar ou em que vai confiar.

---

## 5. Como corre a execução com o Claude Code

- **Inventário só de leitura antes de qualquer mudança.** O Claude Code lê o código e responde a perguntas concretas: quem escreve este campo, que queries existem, que versão está em produção. Só depois se desenha.
- **Inventariar todos os que escrevem um campo**, não só o que se foi procurar. Fechar uma porta e esquecer outra que escreve o mesmo dado foi o erro mais repetido no Kandengue.
- **Primeiro fases com paragens; depois lotes.** Enquanto o desenho está aberto, o Claude Code pára em cada ponto marcado. Quando o desenho fecha, passa a lotes de execução: decide os detalhes de implementação, regista cada decisão com a razão, e só pára no fim do lote, antes de cada deploy, ou quando falta uma decisão de produto. No Kandengue isto acelerou muito sem perder controlo.
- **Revisão independente no fim de cada lote**: um subagente sem o contexto da implementação revê o trabalho contra o desenho e os testes. Apanhou defeitos sérios em quase todos os lotes.
- **O pequeno corrige-se logo.** Um achado diagnosticado, decidido e de âmbito pequeno entra no commit seguinte, cada um no seu commit, com o teste que falharia sem ele. Para registo fica só o que é grande, o que não está decidido, ou o que depende do cliente. Juntar correcções à espera de uma fase futura deu, no Dossier, a sensação de que nada ficava resolvido. (Não confundir com os lotes de execução acima: esses são trabalho contínuo, não correcções à espera.)
- **Prova em produção, não só nos testes.** Scripts só de leitura que o Rafael corre com as credenciais dele, e corridas de teste reais. **Uma consulta que devolve zero resultados não prova nada**: conta como inconclusiva, nunca como "passou".
- **Testar cedo com dados reais**, num plano de teste manual escrito, com uma secção do que já se sabe que não funciona.
- **Segredos.** O Claude Code nunca lê o `.env` nem ficheiros de credenciais de teste, e não instala nada na máquina dele sem perguntar. O que toca produção ou leva segredos: o Claude Code escreve o script, o Rafael corre-o, o chat lê o resultado.

---

## 6. Regras de base de dados e de dados

As que o Dossier aprendeu a custo e que entram no `CLAUDE.md` desde o primeiro dia:

- **O schema só muda por ficheiros do repositório**, aplicados pelo processo documentado. Nunca por `execute_sql` ou `apply_migration` através de um conector. Ler continua permitido.
- **Uma migration é imutável** depois de aplicada a uma base remota. A correcção é uma migration nova. Cada migration abre com `BEGIN` e fecha com `COMMIT`: sem isso, um erro a meio deixa metade aplicada, e metade aplicada parece aplicada. Uma tabela regista as migrations aplicadas, e um comando aplica só as que faltam.
- **Montar a base de raiz tem de funcionar sempre**, verificado antes de cada push por um hook local, além do CI. Um ficheiro só é fonte de verdade se alguém o executar.
- **Tipos gerados a partir da base, nunca escritos à mão.**
- **Uma regra de negócio vive num sítio só.** O Dossier teve a fórmula do mérito em TypeScript e em SQL, e o formato do NIF em quatro sítios. Cada cópia divergiu. Quando houver duas, a do Postgres é a que conta.
- **Dinheiro:** no máximo um pagamento pendente por coisa, garantido na base; nenhuma taxa somada sem aparecer antes de pagar; o preço que a pessoa vê é o que paga; as escritas que envolvem dinheiro são tudo-ou-nada.
- **Nada falha em silêncio.** Toda a escrita verifica o erro, e o ecrã diz a verdade sobre o estado ("em análise", "aprovado, a activar"), sem fingir que acabou.
- **O modelo de linguagem lê, não inventa.** O que não está escrito fica "por confirmar", para a pessoa confirmar.

---

## 7. Convenções

- **Identificadores em inglês, sempre**: variáveis, funções, tipos, ficheiros, colunas, valores de enum e de resposta da API. **Português no que o utilizador lê**: ecrãs, notificações, mensagens de erro. Tem de estar escrito no `CLAUDE.md` desde o primeiro dia; no Kandengue não estava, e o Claude Code foi escrevendo em português sem ninguém dar por isso. (A língua dos comentários, testes e commits está na secção 9.)
- **Nomes que viajam não se renomeiam sozinhos**: colunas, chaves de corpos HTTP, valores de enum gravados, rotas. Renomear exige mudar as duas pontas ao mesmo tempo e verificar todos os usos.
- **Erros da API com dois níveis**: um `code` estável, e só nos erros de negócio uma mensagem em português para o utilizador. A app decide pelo `code`, nunca pela mensagem, e nunca mostra o texto técnico da base. A mensagem diz o que está mal e onde, no campo certo.

---

## 8. Git e deploy no Portal

Decidido pelo Rafael para o Portal:

- **O Claude Code pode fazer commit**, sem `Co-Authored-By`.
- **O push faz o Rafael**, até ele dizer o contrário.
- **Exigem autorização de cada vez:** merge para `main`, reescrever história já enviada (`--amend` depois do push, `rebase`, `reset`, `push --force`, incluindo `--force-with-lease`), e qualquer escrita em produção.
- **Mensagens de commit vão por ficheiro** (`git commit -F`), nunca por `-m` com texto que o shell interpreta: backticks, `$` e `!` executam antes de o git os ver.
- **O rollback fica escrito antes de qualquer deploy.**

---

## 9. Onde os dois briefings discordam — por decidir para o Portal

**L1 — língua dos comentários, testes e mensagens de commit.**
Decidido a 2026-10-15: inglês. Uma fronteira só: tudo o que está no código em inglês, só o que o utilizador vê em português.

**L2 — tag antes ou depois do deploy.**
O Kandengue faz deploy a partir de `main`, com a tag já criada. O Dossier só cria a tag depois de o deploy passar.
`[DECISÃO — proposta: deploy sempre a partir de main; a tag só depois de o deploy passar e o fluxo ter sido visto no ambiente real. Assim uma tag nunca aponta para uma versão que não funcionou.]`

---

## 10. Onde está o estado do Portal

- `docs/inventory/` (00–04) e `HANDOFF.md`: o inventário só de leitura do que existe hoje.
- `docs/_source/product-explainer.md`: o que o produto deve fazer, em rascunho, com as perguntas em aberto (P1–P14) no fim.
- Instruções do Projecto: as nove regras do método.

Para o Portal, a lista de decisões que o servidor tem de assumir (§4) começa por: atribuição de intérpretes a pedidos, preços e o preço acordado na negociação, pagamentos, estados do pedido, verificação dos intérpretes, e avaliações. Hoje, segundo o inventário, nenhuma destas é decidida por servidor nenhum, porque quase nada escreve na base.
