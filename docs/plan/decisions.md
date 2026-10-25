# Decisões — Portal dos Intérpretes

> Todas as decisões tomadas pelo Rafael a 2026-10-18 (Passo 1 do modo contínuo) e antes, e as que ficam **pendentes do cliente** (a Academia Grace Mind), com o comportamento provisório a usar até haver resposta.
>
> **Este ficheiro é a fonte das decisões.** As regras que delas resultam estão nas specs (`specs/*.md`), cada uma com um código `R-…` e um dono (uma função ou uma tabela). Uma decisão não se repete noutro sítio: os outros documentos citam o código `D-xx`.
>
> O Claude Code **não muda nenhuma decisão daqui**. Uma decisão que precise de ser tomada durante a execução vai para `auto-decisions.md`, nunca para este ficheiro.

---

## 1. Públicos e contas

| Código | Decisão |
|---|---|
| **D-01** (empresa) | Uma empresa é uma **organização com membros**, com papéis `owner` (dono), `admin` e `member`. Pode ter uma só pessoa. Um particular é uma conta sem organização. |
| **D-02** (dois papéis) | **Uma conta, vários papéis.** A mesma pessoa pode ser solicitante e intérprete com o mesmo email, e troca de papel no cabeçalho, o que a leva para a app desse papel. |
| **D-03** (entrada no directório) | Um intérprete aparece no directório quando o **perfil mínimo está completo** (regra `R-DIR-01`). Não há aprovação prévia; a equipa pode suspender. |
| **D-04** (login) | **Email e palavra-passe**, com confirmação do email e recuperação da palavra-passe. Sem login social nem SMS. |
| **D-05** (visitante) | O visitante sem conta vê a **lista** de intérpretes, mas **não abre o perfil**, nem os vídeos e artigos. Carregar num intérprete leva ao login e, depois de entrar, de volta ao perfil que queria ver. |
| **D-06** (membros da empresa) | Qualquer membro da organização cria pedidos directos e abertos. Os **pedidos geridos precisam de aprovação** do `owner` ou de um `admin` da organização antes de seguirem para a equipa. |

## 2. Pedidos

| Código | Decisão |
|---|---|
| **D-10** (três tipos) | Há três tipos de pedido: **directo** (o solicitante escolhe o intérprete), **aberto** (fica visível aos intérpretes elegíveis) e **gerido** (a plataforma arranja o intérprete). |
| **D-11** (modo do aberto) | Ao criar um pedido aberto, o solicitante escolhe o modo: **"o primeiro que aceitar"** ou **"eu escolho entre os candidatos"**. |
| **D-12** (gerido) | No pedido gerido, **a equipa escolhe e atribui** o intérprete. O intérprete atribuído aceita ou recusa; se recusar, a equipa atribui outro. |
| **D-13** (negociação) | Há negociação por propostas no chat **nos três tipos**, incluindo o gerido (entre o solicitante e a equipa). No aberto em modo "o primeiro que aceitar" não há negociação: aceita-se o orçamento indicado. |
| **D-14** (preço final) | O preço de cada intérprete **fica fechado quando o pedido é aceite por esse intérprete**. As propostas aceites antes disso são indicativas e passam a ser o preço proposto. Depois da aceitação, não há mais propostas. |
| **D-15** (vários intérpretes) | Um pedido pode precisar de **N intérpretes** (de 1 ao máximo configurado). Acima de uma duração configurável, o Portal sugere dois. Cada intérprete aceita, conclui e é avaliado separadamente. |
| **D-16** (beneficiário) | O pedido tem um campo **"para quem é"** (nome e contacto opcional), visível só aos intérpretes aceites. |
| **D-17** (deslocação) | O intérprete pode definir uma **taxa de deslocação** para serviços presenciais. Aparece separada e somada ao total **antes** de o pedido ser enviado. |
| **D-18** (unidade de preço) | Cada serviço do catálogo diz se é cobrado **por hora** ou a **preço fixo**. Nos serviços à hora há mínimo e arredondamento configuráveis. |
| **D-19** (urgentes) | São permitidos pedidos para menos de 24 horas (limite configurável). Ficam marcados como **urgentes**, e a expiração passa a ser a hora do próprio serviço. Sem acréscimo de preço por omissão. |
| **D-20** (link online) | No serviço online, o solicitante indica o link da reunião ao criar o pedido, como a interface já faz. Um intérprete aceite pode substituí-lo até ao início do serviço. *(Decisão do desenho, não perguntada; o Rafael pode mudá-la.)* |

## 3. Ciclo do serviço

| Código | Decisão |
|---|---|
| **D-21** (conclusão) | O **intérprete marca o serviço como feito**; o solicitante confirma, ou o sistema confirma sozinho ao fim de 48 horas (configurável). Qualquer um pode abrir uma **disputa**, que vai para a equipa. |
| **D-22** (cancelamento) | Qualquer parte cancela **livremente até 24 horas antes** (configurável). Depois disso o cancelamento fica registado como **tardio** e aparece no perfil de quem cancelou. |
| **D-23** (sobreposição) | Um intérprete **não pode aceitar** um pedido que se sobreponha a outro já aceite. A base de dados recusa, contando uma margem configurável para deslocação. |
| **D-24** (sem resposta) | Um convite a um intérprete (pedido directo ou gerido) sem resposta **expira em 48 horas** (configurável), ou à hora do serviço se chegar antes. O solicitante (ou a equipa, no gerido) é avisado. |

## 4. Dinheiro

| Código | Decisão |
|---|---|
| **D-30** (directos e abertos) | O pagamento dos pedidos directos e abertos **combina-se fora da plataforma**. O Portal regista o preço acordado, mas não movimenta dinheiro. **Pendente da Academia** (ver `PC-01`). |
| **D-31** (pagamento do gerido) | O solicitante paga o pedido gerido por **transferência bancária com comprovativo**. A equipa financeira valida-o à mão. |
| **D-32** (repasse) | No pedido gerido, quando o serviço fica concluído sem disputa, o valor do intérprete entra numa **fila do financeiro**, que transfere à mão e regista a referência. |
| **D-33** (margem do gerido) | O intérprete recebe uma **percentagem fixa configurável** do preço do gerido, e vê esse valor antes de aceitar. O valor da percentagem fica **pendente da Academia** (`PC-02`). |
| **D-34** (taxa de verificação) | A verificação é **paga**, por transferência com comprovativo, e o selo dura **um ano**. O intérprete é avisado 30 dias antes de expirar. O valor fica **pendente da Academia** (`PC-03`). |
| **D-35** (reembolsos) | As políticas de reembolso (verificação recusada; gerido cancelado) são **configuráveis no painel de administração**, em versões publicadas (`D-63`). Os valores por omissão estão em `R-PAY-08` e `R-PAY-09`. |
| **D-36** (recibos e facturas) | O Portal emite um **recibo simples**. A factura legal e o IVA ficam **pendentes do contabilista da Academia** (`PC-04`) e **bloqueiam a produção**. |
| **D-37** (montantes) | Todos os montantes são **kwanzas inteiros** (sem cêntimos). Moeda única: AOA. *(Decisão do desenho.)* |

## 5. Confiança e verificação

| Código | Decisão |
|---|---|
| **D-40** (selo) | O selo de verificação **exige prova da formação da Academia Grace Mind**, como um dos documentos obrigatórios. A lista de documentos é configurável. |
| **D-41** (opcional) | A verificação é **opcional**: um intérprete não verificado recebe pedidos como qualquer outro. |
| **D-42** (suspensão) | Uma conta suspensa **não entra** e **sai do directório**. Os pedidos futuros são cancelados, a outra parte é avisada e os pagos são reembolsados por inteiro. |
| **D-43** (avaliações) | As avaliações só existem depois de o serviço estar concluído. São **duplamente cegas**: aparecem quando os dois avaliaram, ou ao fim de 14 dias (configurável). |
| **D-44** (avaliações do solicitante) | As avaliações feitas a um solicitante são vistas **só por intérpretes**, quando recebem um pedido dele. |
| **D-45** (conteúdo) | Os vídeos e artigos dos intérpretes **publicam logo**. Qualquer pessoa com conta pode denunciar, e a equipa pode retirar, com registo na auditoria. |

## 6. Comunicação

| Código | Decisão |
|---|---|
| **D-50** (canais) | Os avisos chegam **no Portal e por email**. O WhatsApp fica para a **fase com nome "Canal WhatsApp"** (`FP-02`), porque exige verificação da Meta. |
| **D-51** (contactos) | O telefone e as redes do intérprete são **visíveis a qualquer pessoa com conta**. **Objecção registada (`OB-01`).** |
| **D-52** (chat) | O chat existe **só dentro de um pedido**. Abre com o pedido e fecha 7 dias (configurável) depois de o pedido terminar. Fica guardado. |

## 7. Dados pessoais

| Código | Decisão |
|---|---|
| **D-55** (consentimento) | **Aceitação activa** dos termos e da política de privacidade no registo, com versão e data guardadas. Uma versão nova pede nova aceitação no login seguinte. Os textos legais ficam vazios até a Academia os dar (`PC-05`), o que **bloqueia a produção**. |
| **D-56** (apagar conta) | Apagar a conta, ou retirar o consentimento, **anonimiza e guarda o histórico**: nome, contactos, fotografia e documentos desaparecem; pedidos, avaliações e pagamentos ficam sem nome. É **recusado** enquanto houver um pedido em curso ou um pagamento por resolver. |
| **D-57** (documentos de verificação) | Os documentos de verificação (BI, registo criminal, certificados) **mantêm-se** enquanto a conta existir, e são apagados na anonimização. Só o próprio e a equipa os veem. |
| **D-58** (leitura de conversas) | A equipa pode ler as conversas de qualquer pedido **sempre que precisar**. Cada leitura fica na auditoria. **Objecção registada (`OB-02`).** |

## 8. Administração

| Código | Decisão |
|---|---|
| **D-60** (níveis) | Quatro níveis de equipa: **`super_admin`** (tudo, incluindo equipa e configuração), **`moderator`** (utilizadores, verificações, pedidos, conteúdo, comunidade), **`finance`** (pagamentos, repasses, reembolsos, relatórios financeiros) e **`request_operator`** (pedidos geridos: orçamentos e atribuição, com a leitura de pedidos geridos e de intérpretes que isso exige). Todos os níveis respondem a tickets de suporte. **A definição é a matriz de `specs/staff-and-config.md` (`R-STF-01`)**; este resumo não a substitui. |
| **D-61** (exportações) | Só `super_admin` e `finance` exportam CSV. Cada exportação fica na auditoria, e nenhuma leva documentos nem conversas. |
| **D-62** (auditoria) | Regista **todas as acções da equipa e todas as mudanças de estado**, com o valor antes e depois. Ninguém altera nem apaga entradas, nem o `super_admin`. |
| **D-63** (configuração) | Preços, prazos e percentagens vivem em **versões publicadas, nunca editadas**. Mudar cria uma versão nova. Cada pedido e cada pagamento guardam a versão em vigor quando foram criados. |

## 9. Âmbito e arquitectura

| Código | Decisão |
|---|---|
| **D-70** (sem MVP) | O âmbito é completo, entregue em passos verticais (`MASTER-PLAN.md`). |
| **D-71** (comunidade) | As áreas de comunidade **entram neste plano**: bolsa de oportunidades, eventos e masterclasses, formação, mentoria, biblioteca e apoio jurídico e ético, fórum e feed, benefícios e parcerias, suporte. O que cada uma faz está em `D-72` a `D-79`. |
| **D-72** (oportunidades) | Trabalhos longos (contratos, vagas, colaborações). Publicam **a equipa e as organizações**; os intérpretes candidatam-se; quem publicou vê as candidaturas. Os pedidos ficam para serviços pontuais. |
| **D-73** (eventos) | A equipa publica eventos e masterclasses, com inscrição **gratuita ou paga** (por comprovativo), lotação, lista de inscritos e presenças. |
| **D-74** (formação) | **Catálogo de cursos com links externos.** O Portal não gere inscrições nem conclusões; a prova da formação para o selo continua a ser um documento carregado (`D-40`). |
| **D-75** (mentoria) | Intérpretes **verificados** oferecem-se como mentores; um intérprete pede mentoria; a equipa aprova o par e acompanha. Sem dinheiro. |
| **D-76** (biblioteca e jurídico) | **Só recursos para ler**: guias, modelos, legislação, código de ética, perguntas frequentes. Publicados pela equipa. Sem pedidos de apoio. |
| **D-77** (fórum e feed) | Um **fórum só para intérpretes** (tópicos por categoria, respostas, marcar solução) e um **feed** (publicações curtas com imagem, comentários e gostos) onde **os intérpretes publicam e qualquer pessoa com conta vê**. Ambos com denúncia e moderação. |
| **D-78** (benefícios) | Descontos de parceiros, **visíveis só a intérpretes verificados**. |
| **D-79** (suporte) | **Tickets** para qualquer utilizador, com categoria e estados; a equipa responde no Portal e por email. O formulário de contacto do site também chega à equipa. |
| **D-80** (apps) | **Quatro apps**, uma por público: `site-web` (público), `requester-web` (solicitantes, incluindo empresas), `interpreter-web` (intérpretes) e `admin-web` (equipa). |
| **D-81** (alojamento) | As apps web ficam na **Hostinger**; a API fica no **Railway**, com Dockerfile. Nada vai para produção nesta corrida. |
| **D-82** (dados de desenvolvimento) | **Seed fictício** a partir dos mocks actuais: intérpretes, pedidos e contas de teste para cada papel. A base antiga não se aproveita. |
| **D-83** (acessibilidade) | Texto simples, e um **espaço para vídeo em LGA** nas páginas principais e nos passos do pedido, que a Academia preenche quando tiver os vídeos. |
| **D-84** (língua do código) | Identificadores, comentários, descrições de testes e mensagens de commit em **inglês**. Português só no que o utilizador vê e na documentação. (Antes chamado L1.) |
| **D-85** (base local) | O projecto Supabase remoto está pausado. Trabalha-se com o **Supabase local em Docker**. A base antiga não é tocada. |

## 9a. Decisões do desenho

Tomadas por quem desenhou o plano, para fechar buracos que a revisão independente encontrou. Seguem a regra "a opção que protege os dados das pessoas e o dinheiro já pago". **O Rafael pode mudá-las**; até lá, valem como as outras.

| Código | Decisão |
|---|---|
| **D-90** (suspensão num gerido pago) | Se o **intérprete** de um gerido pago é suspenso, conta como se tivesse cancelado: a equipa procura substituto (`R-MAN-07`), e só sem substituto há reembolso. Se é o **solicitante** (ou a organização) que é suspenso, o pedido é cancelado e o reembolso é total. |
| **D-91** (base dos reembolsos do gerido) | O gerido cobra `managed_unit_price_aoa × intérpretes`. Cada atribuição vale `managed_unit_price_aoa`. Um reembolso por atribuição (disputa, lugar sem substituto) é sobre esse valor; o cancelamento do pedido inteiro é sobre a soma. Expirar à hora de início sem todos os intérpretes, depois de pago, devolve **tudo**, porque o serviço não acontece. |
| **D-92** (orçamento do "primeiro que aceitar") | No pedido aberto em modo "o primeiro que aceitar", o orçamento por intérprete é **tudo incluído**: não se soma deslocação. O total mostrado antes de enviar é orçamento × intérpretes (`D-17` cumpre-se assim). |
| **D-93** (pedidos da própria organização) | Um intérprete **não é elegível** para pedidos que ele próprio criou nem para pedidos de uma organização de que é membro, para evitar conflito de interesses (`R-DIR-09`). |
| **D-94** (pagamento em validação à hora do serviço) | Se a hora do serviço chega com o comprovativo **enviado mas ainda por validar**, o serviço mantém-se: quem pagou fez a sua parte. A equipa financeira é avisada com urgência duas horas antes. O repasse só entra em fila depois de o pagamento ser confirmado. |
| **D-95** (morada antes de aceitar) | Os intérpretes que ainda não aceitaram veem só a cidade do serviço presencial; a morada exacta e o beneficiário aparecem depois de aceitarem. |
| **D-96** (registos financeiros na anonimização) | Ao apagar uma conta, os **comprovativos, recibos, cópias de dados bancários nos repasses e a auditoria mantêm-se**, porque são prova de dinheiro e de acções. Só os vê a equipa financeira (ou o `super_admin`, na auditoria). |
| **D-97** (comentários no feed) | No feed, só os intérpretes comentam e reagem; os solicitantes veem. |

---

## 10. Pendentes do cliente (Academia Grace Mind)

Cada uma tem um comportamento provisório, que o Claude Code usa até haver resposta. **Não se inventa outro.**

| Código | Pergunta | Comportamento provisório | Bloqueia produção? |
|---|---|---|---|
| **PC-01** (comissão nos directos e abertos) | O Portal deve cobrar comissão sobre os pedidos directos e abertos? | Não. O dinheiro combina-se fora (`D-30`). A comissão, se vier, é a fase com nome `FP-01`. | Não |
| **PC-02** (margem do gerido) | Que percentagem do pedido gerido recebe o intérprete? | `managed_interpreter_share_pct` fica **vazio** na versão de configuração de produção. No seed de desenvolvimento usa-se **80**, marcado como fictício. Sem valor publicado, **criar** um pedido gerido é recusado com mensagem clara (`R-REQ-01`), para nenhum pedido ficar preso numa versão sem valor. | **Sim** |
| **PC-03** (taxa de verificação) | Quanto custa a verificação? | `verification_fee_aoa` fica **vazio** em produção; no seed de desenvolvimento, **15 000**, marcado como fictício. Sem valor publicado, submeter uma verificação é recusado com mensagem clara. A taxa é a da versão em vigor **no momento da submissão**. | **Sim** |
| **PC-04** (factura e IVA) | Que documento fiscal se emite, e há IVA? | Recibo simples do Portal. `tax_rate_pct = 0`, `prices_include_tax = true`. | **Sim** |
| **PC-05** (textos legais) | Termos de utilização e política de privacidade. | Documentos legais criados **vazios**; o registo mostra "Texto em preparação". Ver `R-PRIV-01`. | **Sim** |
| **PC-06** (dados bancários) | IBAN, banco e beneficiário da Academia, para as transferências. | Campos vazios na configuração de produção; no seed de desenvolvimento, valores fictícios marcados como tal. Sem eles, recusa-se logo à entrada tudo o que vai precisar de cobrar: criar um gerido, submeter uma verificação, inscrever num evento pago. | **Sim** |
| **PC-07** (documentos do selo) | Lista exacta dos documentos exigidos para o selo. | BI, registo criminal e certificado da formação da Academia, todos obrigatórios; "outro" opcional. Lista editável pela equipa. | Não |
| **PC-08** (vídeos LGA) | Vídeos em LGA para as páginas e passos. | Espaços vazios, escondidos enquanto não houver vídeo. | Não |
| **PC-09** (domínio e email) | Domínio do Portal e remetente de email. | Desenvolvimento usa o servidor de email local do Supabase. O fornecedor de email de produção é um adaptador por configurar. | **Sim** |

## 11. Fases com nome (fora desta corrida)

| Código | Fase | Porquê fica de fora |
|---|---|---|
| **FP-01** (comissão nos directos e abertos) | Pagamento pela plataforma nos pedidos directos e abertos, com comissão. | Depende de `PC-01`. |
| **FP-02** (Canal WhatsApp) | Avisos por WhatsApp. | Exige conta WhatsApp Business verificada pela Meta. |
| **FP-03** (Multicaixa Express) | Pagamento automático por Multicaixa Express, a substituir o comprovativo. | Exige homologação EMIS (15 a 30 dias úteis). |
| **FP-04** (produção) | Projecto Supabase de produção, API no Railway, apps na Hostinger, domínios, backups. | Nada vai para produção nesta corrida. |

## 12. Objecções registadas

Decisões do Rafael contra a recomendação do Claude que desenha. Seguem-se como decididas; ficam aqui para serem revistas com o cliente.

**OB-01 — contactos visíveis a todos com conta (`D-51`).** Se qualquer pessoa com conta vê o telefone do intérprete, o serviço combina-se fora do Portal. O pedido gerido, que é a única receita sobre serviços, perde a razão de existir: quem quer poupar a margem liga directamente. A recomendação era mostrar os contactos só depois de um pedido aceite.

**OB-02 — a equipa lê qualquer conversa (`D-58`).** A Lei n.º 22/11 (Protecção de Dados Pessoais, Angola) exige que o acesso a dados pessoais seja proporcional à finalidade. Ler conversas privadas sem uma razão concreta, como uma disputa, é difícil de justificar se houver uma reclamação. A recomendação era abrir as conversas à equipa só em disputa. O desenho mantém a decisão e acrescenta duas protecções que não a contrariam: cada leitura fica na auditoria, e a política de privacidade (`PC-05`) tem de o dizer aos utilizadores.

**OB-03 — documentos de verificação guardados enquanto a conta existir (`D-57`).** Um registo criminal guardado anos depois de a decisão estar tomada é risco sem benefício. A recomendação era apagá-los 90 dias depois da decisão.

---

## 13. O que bloqueia a produção

Lista única. Cada passo do plano que encontrar um bloqueio novo acrescenta-o aqui **através de `auto-decisions.md`**, nunca directamente.

1. `PC-02` (margem do gerido), `PC-03` (taxa de verificação), `PC-04` (factura e IVA), `PC-05` (textos legais), `PC-06` (dados bancários), `PC-09` (domínio e email).
2. `FP-04` (produção): o projecto Supabase de produção, a API publicada e as apps alojadas.
3. A política de privacidade tem de dizer que a equipa pode ler conversas (`OB-02`) e quanto tempo se guardam os documentos (`OB-03`).
