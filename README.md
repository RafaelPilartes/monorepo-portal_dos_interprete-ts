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

## 🧠 Tecnologias

| Camada      | Tecnologia                           |
| ----------- | ------------------------------------ |
| **Runtime** | React 18 · TypeScript 5 · Vite 5     |
| **Styling** | Tailwind CSS 3 · tailwindcss-animate |
| **UI Kit**  | shadcn/ui (Radix UI primitives)      |
| **Routing** | React Router DOM 6                   |
| **Data**    | TanStack React Query 5               |
| **Forms**   | React Hook Form · Zod                |
| **Charts**  | Recharts                             |
| **Icons**   | Lucide React                         |
| **Fonts**   | Plus Jakarta Sans (Google Fonts)     |

---

## 📁 Estrutura do Projecto

```
src/
├── assets/              # Imagens (hero, serviços, ícones)
├── components/
│   ├── layout/          # PublicLayout, Header, Footer
│   ├── dashboard/       # Componentes partilhados dos dashboards
│   ├── ui/              # shadcn/ui components
│   └── *.tsx            # Componentes reutilizáveis (PageBanner, InterpreterCard, etc.)
├── core/
│   └── entities/        # Entidades de domínio (UserEntity, etc.)
├── data/                # Dados estáticos (intérpretes, testemunhos)
├── hooks/               # Custom React hooks
├── lib/                 # Utilitários (cn, helpers)
├── pages/
│   ├── portal/          # Páginas públicas
│   │   ├── auth/        # Login, Register, RecoverPassword
│   │   └── *.tsx        # Home, Services, Interpreters, Impact, etc.
│   └── dashboard/       # Painéis de controlo
│       ├── admin/       # Dashboard do Administrador (17 ecrãs)
│       ├── interpreter/ # Dashboard do Intérprete (13 ecrãs + profile)
│       ├── requester/   # Dashboard do Solicitante (11 ecrãs)
│       └── modules/     # Módulos placeholder para expansão
├── routes/
│   ├── AppRoutes.tsx    # Router principal
│   ├── PublicRoutes.tsx # Rotas públicas (portal)
│   ├── AdminRoutes.tsx  # Rotas do administrador
│   ├── InterpreterRoutes.tsx  # Rotas do intérprete
│   └── RequesterRoutes.tsx    # Rotas do solicitante
└── App.tsx              # Entry point
```

---

## 🗺️ Arquitectura de Rotas

O routing está modularizado em ficheiros separados por domínio:

### Rotas Públicas (`/`)

| Rota                                        | Página                    |
| ------------------------------------------- | ------------------------- |
| `/home`                                     | Home Page                 |
| `/services`                                 | Serviços de Interpretação |
| `/how-it-works`                             | Como Funciona             |
| `/impact`                                   | Impacto Social            |
| `/contact`                                  | Contacto                  |
| `/for-requesters`                           | Para Solicitantes         |
| `/for-interpreters`                         | Para Intérpretes          |
| `/interpreters`                             | Directório de Intérpretes |
| `/interpreters/:slug`                       | Perfil do Intérprete      |
| `/interpreters/:slug/videos`                | Vídeos do Intérprete      |
| `/interpreters/:slug/articles`              | Artigos do Intérprete     |
| `/interpreters/:slug/articles/:articleSlug` | Artigo Individual         |
| `/tutorials`                                | Tutoriais                 |

### Autenticação

| Rota                | Página             |
| ------------------- | ------------------ |
| `/login`            | Login              |
| `/register`         | Registo            |
| `/recover-password` | Recuperar Password |

---

### Dashboard Solicitante

- Solicitações
- Nova Solicitação
- Histórico
- Favoritos
- Avaliações
- Perfil
- Definições

---

### Dashboard Intérprete

- Perfil profissional
- Solicitações
- Agenda e disponibilidade
- Ganhos
- Avaliações
- Verificação
- Documentos
- Definições

---

### Dashboard Administrador

- Gestão de intérpretes
- Gestão de solicitantes
- Gestão de solicitações
- Verificações
- Relatórios
- Pagamentos
- Serviços
- Definições

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

- Node.js ≥ 18
- npm ≥ 9

### Comandos

```sh
# Clonar o repositório
git clone <URL_DO_REPOSITORIO>
cd web-portal_do_interprete-ts

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Pré-visualizar build
npm run preview

# Lint
npm run lint
```

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
