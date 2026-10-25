# Portal dos Intérpretes

Plataforma digital para a **gestão, visibilidade e valorização de intérpretes de Língua Gestual Angolana (LGA)**, conectando profissionais qualificados a instituições e pessoas que necessitam de acessibilidade comunicacional.

---

## 🌍 Contexto e Propósito

O **Portal dos Intérpretes** surge como uma solução digital para responder à necessidade de **organização, profissionalização e acesso estruturado a serviços de interpretação** em Angola.

A plataforma tem como objectivo:

- Centralizar intérpretes qualificados num directório profissional
- Facilitar o acesso a serviços de interpretação
- Conectar intérpretes a instituições e solicitantes
- Promover inclusão em contextos educacionais, jurídicos, médicos e sociais
- Fortalecer a visibilidade e credibilidade da profissão

---

## 🏛️ Posicionamento

O **Portal dos Intérpretes** é uma plataforma:

- Independente
- Institucional
- Inclusiva
- Orientada à profissionalização

> Desenvolvido com contributo técnico da **Academia Grace Mind**, no âmbito da promoção da inclusão e acessibilidade comunicacional.

---

## 🧠 Tecnologias e estrutura

Monorepo **pnpm + Turborepo** (ADR-001), Node ≥ 22. Quatro apps web (Vite + React 18 + TypeScript estrito + Tailwind + shadcn/ui) e uma API (Fastify), sobre Supabase. Detalhe em `docs/plan/architecture.md`.

```
apps/
  site-web/          site público (http://localhost:5170)
  requester-web/     solicitantes (http://localhost:5171)
  interpreter-web/   intérpretes (http://localhost:5172)
  admin-web/         equipa da plataforma (http://localhost:5173)
  api/               Fastify (http://localhost:3000/health)
packages/            ui, i18n, core, auth, data, features, db, db-types, config
tests/e2e/           Playwright: percorre as rotas de cada app
scripts/verify.py    verificações estruturais
docs/plan/           plano, decisões, especificações, registo da corrida
```

As rotas de cada app estão em `docs/plan/architecture.md` §3 e em `docs/inventory/05-route-map.md`.

---

## 📚 Funcionalidades Principais

### 🌐 Portal Público

- Página inicial com apresentação institucional
- Directório de intérpretes com filtros avançados
- Perfis profissionais detalhados
- Sistema de solicitação de serviços
- Conteúdos educativos e tutoriais

---

### 👤 Solicitantes

- Solicitar serviços de interpretação
- Acompanhar pedidos
- Avaliar intérpretes
- Gerir histórico

---

### 🎤 Intérpretes

- Criar e gerir perfil profissional
- Submeter certificações
- Receber e responder a solicitações
- Gerir agenda e disponibilidade
- Processo de verificação

---

### 🛡️ Administração

- Validar e credenciar intérpretes
- Gerir utilizadores e solicitações
- Monitorar actividade da plataforma
- Gerar relatórios

---

## 🎨 Identidade Visual

| Token         | Valor HSL         | Aplicação                    |
| ------------- | ----------------- | ---------------------------- |
| **Primary**   | `216 92.2% 35.1%` | CTAs, links, estados activos |
| **Secondary** | `272 62.6% 46.1%` | Acentos, gradientes          |
| **Success**   | `152 60.6% 39.8%` | Validações, verificações     |
| **Warning**   | `38 92.2% 50%`    | Alertas, avaliações (★)      |

**Gradientes institucionais:**

- `--gradient-hero`: Primary → Purple → Secondary (135deg)
- `--gradient-banner`: Deep Blue → Blue → Purple (135deg)

**Tipografia:** Plus Jakarta Sans (400–800)

---

## ♿ Acessibilidade

- Interface limpa com contrastes WCAG
- Tipografia legível com bom espaçamento
- Animações suaves com respeito a `prefers-reduced-motion`
- Navegação por teclado e ARIA roles nos tabs
- Foco em comunicação acessível para todos os públicos

---

## 🛠️ Execução Local

### Pré-requisitos
- Node.js ≥ 22 e pnpm 10 (`npm install -g pnpm@10`)
- Docker (para a base de dados local, a partir do passo F do plano)

### Comandos

```bash
pnpm install          # instala tudo e activa o hook pre-push
pnpm dev              # arranca as quatro apps e a API
pnpm build            # build de produção de todas
pnpm lint             # ESLint
pnpm typecheck        # TypeScript
pnpm test             # testes unitários
pnpm verify           # verificações estruturais (scripts/verify.py)
pnpm e2e              # Playwright (instalar o browser uma vez:
                      # pnpm --filter @portal-dos-interpretes/e2e exec playwright install chromium)
```

Variáveis de ambiente: copiar `.env.example` para `.env` (nunca versionar o `.env`).

---

## 👥 Público-Alvo

- **Intérpretes** de Língua Gestual Angolana
- **Instituições** de ensino, saúde e justiça
- **Organizações** públicas e privadas
- **Eventos** e projectos sociais
- **Comunidade** que necessite de acessibilidade comunicacional

---

## 📄 Licença

Projecto da **Academia Grace Mind**. Todos os direitos reservados.
