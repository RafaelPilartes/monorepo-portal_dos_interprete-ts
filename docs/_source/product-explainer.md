# Portal dos Intérpretes — o que é e como funciona

> **Rascunho 1 — 2026-10-15.** Escrito a partir do que a interface actual já mostra (inventário em `docs/inventory/`) e do que o Rafael decidiu. Quando este documento e o código discordarem, ou o código tem um defeito, ou há uma decisão por tomar — e essa decisão fica registada aqui.
>
> Onde uma coisa só aparece na interface e ainda ninguém a confirmou, está marcada **(a confirmar)**. O que está mesmo por decidir não está no texto: está na última secção, "O que ainda não está decidido".
>
> **Actualização de 2026-10-25 (passo A do plano).** As perguntas P1–P14 foram decididas a 2026-10-18: **as decisões estão em `docs/plan/decisions.md`** (códigos `D-xx`, e `PC-xx` para as pendentes do cliente) e **as regras em `docs/plan/specs/`** (códigos `R-…`). A secção 8 aponta para elas. O texto das secções 1 a 7 só mudou onde contradizia uma decisão; quando este documento e `decisions.md` discordarem, vale `decisions.md`.

---

## 1. O que é

O Portal dos Intérpretes é a plataforma da Academia Grace Mind que junta quem precisa de um intérprete com quem o pode fazer. Língua Gestual Angolana em primeiro lugar, mas também línguas faladas.

Hoje, encontrar um intérprete em Angola é uma questão de conhecer alguém que conhece alguém. O Portal muda isso: o intérprete tem um perfil com o que sabe fazer, quanto cobra e o que outras pessoas acharam do trabalho dele. Quem precisa de um intérprete encontra-o, pede, combina o preço e marca, tudo no mesmo sítio.

O Portal é aberto a todos os intérpretes, verificados ou não. A Academia acrescenta uma coisa que mais ninguém pode dar: o **selo de verificação**, que diz que aquele intérprete passou pela formação da Academia e cumpre o código de ética. Não é obrigatório para trabalhar na plataforma. É o que distingue.

---

## 2. Quem usa

**O visitante.** Qualquer pessoa, sem conta. Vê o site, vê a lista de intérpretes, vê os tutoriais e contacta a plataforma. Não abre o perfil de nenhum intérprete: para ver os detalhes, tem de entrar com conta.

**O solicitante.** Quem precisa de um intérprete. Pode ser um **particular** — uma pessoa surda que vai a uma consulta, uma família com um casamento — ou uma **empresa**, que precisa de intérpretes para reuniões, formações ou eventos e tem NIF, morada e sector. A empresa é uma **organização com membros** (dono, administradores e membros), e pode ter uma só pessoa (D-01 (empresa)); os pedidos geridos de uma organização precisam de aprovação do dono ou de um administrador dela (D-06 (membros da empresa)).

**O intérprete.** Quem presta o serviço. Tem um perfil, define os seus serviços e preços, diz quando está disponível, recebe pedidos e responde-lhes. Pode pedir a verificação da Academia.

**A equipa da plataforma.** Os administradores. Gerem os intérpretes, os solicitantes, os pedidos, as verificações e o conteúdo. Não são todos iguais: há níveis diferentes, e cada nível vê e faz coisas diferentes.

---

## 3. Como se arranja um intérprete

É o centro do Portal. Há três maneiras de começar:

**Escolher um intérprete.** O solicitante encontra no directório o intérprete que quer e faz-lhe o pedido directamente. O preço de partida é o que esse intérprete cobra pelo serviço.

**Publicar o pedido.** O solicitante descreve o que precisa e o pedido fica visível para os intérpretes que podem fazê-lo. Ao criá-lo, escolhe o modo: **"o primeiro que aceitar"** ou **"eu escolho entre os candidatos"** (D-11 (modo do aberto)).

**Pedir à plataforma.** O solicitante não quer escolher, ou não sabe escolher: pede à plataforma que arranje alguém. Aqui o preço de partida é o da plataforma, e é a equipa que escolhe e atribui o intérprete (D-12 (gerido)); o preço também se pode negociar, entre o solicitante e a equipa (D-13 (negociação)). É pago ao Portal por transferência com comprovativo (D-31 (pagamento do gerido)). Nos outros dois caminhos o dinheiro combina-se fora da plataforma (D-30 (directos e abertos)).

Seja qual for o caminho, o pedido tem sempre o mesmo conteúdo:

- o tipo de serviço;
- se é **online** ou **presencial**;
- o dia e a hora;
- o link da reunião, se for online, ou a morada, se for presencial;
- quanto tempo dura;
- e, no fim, uma revisão de tudo antes de enviar.

### Combinar o preço

O preço de partida não tem de ser o final. Solicitante e intérprete podem falar no chat do pedido e **propor valores um ao outro**. Quando um aceita a proposta do outro, esse passa a ser o preço proposto; o preço fica fechado quando o intérprete aceita o pedido (D-14 (preço final)). No pedido aberto em modo "o primeiro que aceitar" não há negociação (D-13 (negociação)).

### Depois de combinado

O intérprete aceita ou recusa o pedido. Se recusar, diz porquê. O solicitante pode cancelar o pedido. A equipa da plataforma vê todos os pedidos e pode intervir em qualquer um.

No dia, o serviço acontece. O **intérprete marca-o como feito**; o solicitante confirma, ou o sistema confirma sozinho ao fim de 48 horas, e qualquer um pode abrir uma disputa, que vai para a equipa (D-21 (conclusão)). Depois, **os dois avaliam-se**: o solicitante avalia o intérprete e o intérprete avalia o solicitante, com uma nota de 1 a 5 e um comentário. As avaliações são duplamente cegas (D-43 (avaliações)). As dos intérpretes aparecem no perfil; as feitas a um solicitante só as veem intérpretes (D-44 (avaliações do solicitante)).

---

## 4. O intérprete

### O perfil

É a montra do intérprete. Só quem tem conta o abre; o visitante vê o intérprete na lista, mas não entra no perfil. Tem:

- uma apresentação: quem é, há quanto tempo trabalha, se trabalha online, presencialmente ou das duas formas;
- as línguas que interpreta e as áreas em que se especializa — saúde, justiça, educação, eventos, entre outras;
- os serviços que oferece, cada um com o seu preço, e se aceita negociar;
- a tarifa mínima por hora;
- o percurso: formação, experiência profissional e certificações;
- conteúdo próprio: vídeos e artigos;
- as avaliações que recebeu;
- a disponibilidade;
- contactos e redes sociais, visíveis a qualquer pessoa com conta (D-51 (contactos); objecção OB-01 registada).

### A disponibilidade

O intérprete marca a sua semana habitual — por exemplo, segundas a sextas das 9h às 17h — e pode bloquear dias específicos em que não está disponível.

### Os pedidos

O intérprete vê os pedidos que lhe foram feitos e aceita ou recusa cada um. Vê também os pedidos publicados, abertos a quem os quiser, e responde aos que lhe interessam. Tem uma agenda com os serviços marcados e um resumo do que já ganhou.

### A verificação

É opcional. O intérprete pede a verificação, envia os documentos que a Academia pede — documento de identidade, registo criminal, certificados — e a equipa analisa. Se for aprovado, o perfil passa a mostrar o selo da Academia Grace Mind.

Um intérprete não verificado recebe pedidos como qualquer outro. O selo diz duas coisas a quem procura: que este intérprete foi formado pela Academia e que se compromete com o código de ética.

A verificação é também uma das fontes de receita da plataforma, através de uma taxa paga por transferência com comprovativo; o selo dura um ano (D-34 (taxa de verificação); o valor é o pendente PC-03 (taxa de verificação)). O selo exige prova da formação da Academia (D-40 (selo)).

---

## 5. A equipa da plataforma

O painel de administração é onde a Academia gere o Portal. A equipa:

- **gere os intérpretes** — vê a ficha completa e suspende (não há aprovação prévia para entrar no directório: D-03 (entrada no directório));
- **gere os solicitantes** — particulares e empresas, com o mesmo poder de suspender;
- **acompanha todos os pedidos** e pode mudar o estado de qualquer um;
- **trata as verificações** — a fila dos pedidos por analisar, os documentos de cada um, a decisão, e o histórico do que já foi decidido;
- **mantém o catálogo de serviços** e o preço de tabela de cada um;
- **modera o conteúdo** que aparece no site: testemunhos e casos de sucesso;
- **vê relatórios** e o movimento financeiro;
- **gere a própria equipa** — quem é administrador e com que nível;
- **consulta o registo de auditoria**: quem fez o quê, quando.

---

## 6. O site público

É a porta de entrada, para quem ainda não tem conta:

- a página inicial, com os intérpretes em destaque, vídeos e testemunhos;
- os serviços e como funciona;
- duas páginas próprias, uma para quem procura intérpretes e outra para intérpretes que querem entrar;
- o impacto social do projecto;
- o directório de intérpretes, com pesquisa e filtros;
- tutoriais em vídeo de Língua Gestual Angolana;
- um formulário de contacto.

O directório mostra a lista, não os detalhes. O perfil de cada intérprete, com os seus vídeos e artigos, só abre depois de entrar com conta. Quem carrega num intérprete sem ter sessão vai para o login e, depois de entrar, volta ao perfil que queria ver.

---

## 7. Comunidade e formação

A interface já reserva lugar para dez áreas que ainda não têm conteúdo. Fazem parte do âmbito (D-71 (comunidade)); o que cada uma faz está decidido em D-72 a D-79. A tabela abaixo é o que a interface antiga mostrava, não o desenho final:

| Área | Para quem, segundo a interface |
| --- | --- |
| Bolsa de oportunidades | intérpretes e equipa |
| Eventos e masterclasses | intérpretes e equipa |
| Apoio jurídico e ético | intérpretes e equipa |
| Biblioteca | equipa |
| Comunidade | equipa |
| Formação | equipa |
| Mentoria | equipa |
| Fórum | equipa |
| Benefícios e parcerias | equipa |
| Suporte | equipa |

---

## 8. O que ainda não está decidido

**Já está decidido.** As perguntas P1–P14 foram respondidas a 2026-10-18. A fonte é `docs/plan/decisions.md`; esta tabela só faz a correspondência. O que continua por responder é do cliente (a Academia Grace Mind) e está em `decisions.md` §10, com o comportamento provisório que se usa até haver resposta.

| Pergunta | Decisão em `docs/plan/decisions.md` |
|---|---|
| P1 — empresa: uma conta ou uma equipa? | D-01 (empresa = organização com membros), D-06 (membros da empresa) |
| P2 — publicar o pedido e pedir à plataforma | D-10 (três tipos), D-11 (modo do aberto), D-12 (gerido) |
| P3 — negociação no pedido gerido | D-13 (negociação), D-14 (preço final) |
| P4 — dinheiro | D-30 (directos e abertos: fora da plataforma), D-31 (pagamento do gerido), D-32 (repasse), D-33 (margem do gerido), D-37 (montantes); pendentes PC-01 (comissão) e PC-02 (margem do gerido) |
| P5 — taxa de verificação | D-34 (taxa de verificação); pendente PC-03 (valor da taxa) |
| P6 — fecho do serviço | D-21 (conclusão) |
| P7 — cancelamento | D-22 (cancelamento) |
| P8 — níveis de administrador | D-60 (níveis) |
| P9 — suspensão | D-42 (suspensão), D-90 (suspensão num gerido pago) |
| P10 — os módulos de comunidade | D-71 a D-79 (comunidade) |
| P11 — avisos | D-50 (canais: Portal e email) |
| P12 — conteúdo dos intérpretes | D-45 (conteúdo publica logo) |
| P13 — o link dos serviços online | D-20 (link online) |
| P14 — contactos no perfil | D-51 (contactos visíveis a quem tem conta); objecção OB-01 |

O texto original das perguntas fica abaixo, para história.

<details>
<summary>Perguntas originais (2026-10-15)</summary>



Cada ponto tem um código para ser fácil de citar. Os dois primeiros mudam a estrutura da base de dados, e por isso têm de estar fechados antes de ela ser montada.

**P1 — empresa: uma conta ou uma equipa?**
Uma empresa é uma só conta com NIF? Ou é uma organização onde várias pessoas — RH, chefias — fazem e acompanham pedidos em nome da mesma empresa, cada uma com o seu acesso?

**P2 — publicar o pedido e pedir à plataforma: são o mesmo?**
No pedido publicado, fica com ele o primeiro intérprete que aceitar, ou vários respondem e o solicitante escolhe? E "pedir à plataforma" é outro caminho, com a equipa a escolher, ou é a mesma coisa que publicar?

**P3 — negociação quando é a plataforma a arranjar o intérprete.**
O preço de tabela pode ser negociado, ou é fixo?

**P4 — dinheiro.** *Trava a montagem da base de dados.*
O pagamento do serviço passa pela plataforma — o solicitante paga ao Portal, o Portal paga ao intérprete e fica com uma comissão — ou é combinado entre os dois, fora da plataforma? Se passa, por que meios: Multicaixa Express, transferência, outro? A ideia de partida é que a plataforma seja aberta aos intérpretes e ganhe com a verificação, para os atrair e não os perder para a concorrência. Falta decidir se há também receita sobre os serviços.

**P5 — taxa de verificação.**
Quanto custa? Como se paga? A proposta para começar é referência Multicaixa ou transferência, com o comprovativo validado à mão pela equipa. A verificação expira e renova-se, por exemplo, todos os anos?

**P6 — fecho do serviço.**
Quem diz que o serviço foi feito? A proposta: o intérprete marca como concluído; o solicitante confirma, ou o sistema confirma sozinho passadas 48 horas; qualquer um dos dois pode abrir uma disputa, que vai para a equipa.

**P7 — cancelamento.**
Até quando se pode cancelar, por quem, e com que consequência?

**P8 — níveis de administrador.**
Quais são? A interface prevê três: super-administrador, moderador e financeiro. O que cada um pode fazer será proposto à parte, depois de confirmada a lista.

**P9 — suspensão.**
O que acontece a um intérprete ou solicitante suspenso? Deixa de entrar, deixa de aparecer, ou só deixa de poder fazer pedidos? E os pedidos que já tinha marcados?

**P10 — os módulos de comunidade.**
O que é cada uma das dez áreas da secção 7, e para quem. Em particular: a Formação é a da Academia? E concluir uma formação dá direito à verificação, ou são coisas separadas?

**P11 — avisos.**
Quando há um pedido novo, uma resposta ou uma mudança de estado, como é que a pessoa sabe? Só dentro do Portal, ou também por email, SMS ou WhatsApp?

**P12 — conteúdo dos intérpretes.**
Os vídeos e artigos que os intérpretes publicam aparecem logo, ou passam primeiro pela equipa?

**P13 — o link dos serviços online.**
Quem o cria: o solicitante, o intérprete, ou a plataforma?

**P14 — contactos no perfil.**
O perfil já só abre com conta. Mesmo assim: o telefone e as redes sociais do intérprete aparecem a qualquer pessoa com conta, ou só depois de um pedido aceite? Se aparecerem logo, o serviço pode ser combinado fora da plataforma, e isso pesa directamente em P4.

</details>
