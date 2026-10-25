export interface Tutorial {
  id: string
  title: string
  description: string
  duration: string
  category: 'clientes' | 'interpretes' | 'geral'
  videoUrl: string
  thumbnail?: string
}

export const tutorials: Tutorial[] = [
  // Para Clientes
  {
    id: '1',
    title: 'Como Criar uma Conta no Portal',
    description: 'Aprenda a criar a sua conta como solicitante e configurar o seu perfil.',
    duration: '3:45',
    category: 'clientes',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  {
    id: '2',
    title: 'Como Solicitar um Intérprete',
    description: 'Passo a passo completo para submeter uma solicitação de serviço.',
    duration: '5:20',
    category: 'clientes',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  {
    id: '3',
    title: 'Escolher o Intérprete Ideal',
    description: 'Dicas para encontrar e selecionar o intérprete certo para a sua necessidade.',
    duration: '4:15',
    category: 'clientes',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  {
    id: '4',
    title: 'Acompanhar o Estado da Solicitação',
    description: 'Como verificar e gerir as suas solicitações no painel de controlo.',
    duration: '2:50',
    category: 'clientes',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  // Para Intérpretes
  {
    id: '5',
    title: 'Registo como Intérprete',
    description: 'Guia completo para se registar como intérprete profissional.',
    duration: '4:30',
    category: 'interpretes',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  {
    id: '6',
    title: 'Configurar o Seu Perfil Profissional',
    description: 'Como criar um perfil atrativo que destaque as suas competências.',
    duration: '6:10',
    category: 'interpretes',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  {
    id: '7',
    title: 'Gerir a Sua Agenda',
    description: 'Aprenda a definir a sua disponibilidade e gerir compromissos.',
    duration: '3:55',
    category: 'interpretes',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  {
    id: '8',
    title: 'Aceitar e Gerir Solicitações',
    description: 'Como responder a pedidos e comunicar com clientes.',
    duration: '4:45',
    category: 'interpretes',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  // Geral
  {
    id: '9',
    title: 'Introdução ao Portal dos Intérpretes',
    description: 'Visão geral das funcionalidades e benefícios do portal.',
    duration: '5:00',
    category: 'geral',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  {
    id: '10',
    title: 'Boas Práticas de Comunicação',
    description: 'Dicas para uma comunicação eficaz entre clientes e intérpretes.',
    duration: '4:20',
    category: 'geral',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  }
]
