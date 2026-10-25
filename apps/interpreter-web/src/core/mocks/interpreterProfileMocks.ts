// content
export interface VideoContent {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  type: "apresentacao" | "trabalho" | "palestra" | "aula";
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  status: "draft" | "published";
  createdAt: string;
}

export const initialVideos: VideoContent[] = [
  {
    id: "1",
    title: "Apresentação Profissional",
    description: "Conheça o meu trabalho como intérprete de LGA.",
    url: "https://youtube.com/watch?v=example1",
    tags: ["apresentação", "LGA"],
    type: "apresentacao",
  },
  {
    id: "2",
    title: "Interpretação em Conferência",
    description: "Exemplo de interpretação em evento corporativo.",
    url: "https://youtube.com/watch?v=example2",
    tags: ["conferência", "corporativo"],
    type: "trabalho",
  },
];

export const initialArticles: Article[] = [
  {
    id: "1",
    title: "A Importância da Língua Gestual em Hospitais",
    content: "Lorem ipsum dolor sit amet...",
    excerpt: "Descubra como a interpretação de língua gestual pode salvar vidas em contextos médicos.",
    status: "published",
    createdAt: "2024-01-15",
  },
];

// reviews
export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
  featured: boolean;
  reply?: string;
}

export const initialReviews: Review[] = [
  {
    id: "1",
    author: "João Silva",
    rating: 5,
    comment: "Excelente profissional! A Maria foi fundamental para a minha consulta médica. Muito atenciosa e profissional.",
    date: "2024-01-10",
    service: "Interpretação Médica",
    featured: true,
    reply: "Obrigada pelo feedback, João! Foi um prazer ajudá-lo.",
  },
  {
    id: "2",
    author: "Ana Costa",
    rating: 4,
    comment: "Muito boa intérprete. Pontual e competente. Recomendo!",
    date: "2024-01-05",
    service: "Reunião Corporativa",
    featured: false,
  },
  {
    id: "3",
    author: "Pedro Fernandes",
    rating: 5,
    comment: "A melhor intérprete com quem já trabalhei. Conhecimento técnico impressionante na área jurídica.",
    date: "2023-12-20",
    service: "Interpretação Jurídica",
    featured: false,
  },
];

// experiences
export interface Experience {
  id: string;
  title: string;
  institution: string;
  period: string;
  description: string;
  featured: boolean;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export const initialExperiences: Experience[] = [
  {
    id: "1",
    title: "Intérprete Principal",
    institution: "Hospital Central de Luanda",
    period: "2020 - Presente",
    description: "Interpretação em consultas médicas, cirurgias e emergências.",
    featured: true,
  },
  {
    id: "2",
    title: "Intérprete de Língua Gestual",
    institution: "Tribunal Provincial de Luanda",
    period: "2018 - 2020",
    description: "Interpretação em audiências judiciais e processos legais.",
    featured: false,
  },
];

export const initialEducation: Education[] = [
  {
    id: "1",
    degree: "Licenciatura em Tradução e Interpretação",
    institution: "Universidade Agostinho Neto",
    year: "2015",
  },
];

export const initialCertifications: Certification[] = [
  {
    id: "1",
    name: "Certificação em Língua Gestual Angolana",
    issuer: "Instituto Nacional de Surdos",
    year: "2016",
  },
];

// services
export interface Service {
  id: string;
  name: string;
  description: string;
  modality: "presencial" | "online" | "ambos";
  basePrice?: number | undefined;
  image?: string | undefined;
  availableForOpenRequests: boolean;
}

export const initialServices: Service[] = [
  {
    id: "1",
    name: "Interpretação Médica",
    description: "Acompanhamento em consultas, exames e procedimentos médicos.",
    modality: "presencial",
    basePrice: 8000,
    availableForOpenRequests: true,
  },
  {
    id: "2",
    name: "Interpretação Jurídica",
    description: "Interpretação em audiências, consultas com advogados e procedimentos legais.",
    modality: "ambos",
    basePrice: 10000,
    availableForOpenRequests: true,
  },
  {
    id: "3",
    name: "Reuniões Corporativas",
    description: "Interpretação em reuniões de trabalho, conferências e eventos empresariais.",
    modality: "online",
    basePrice: 6000,
    availableForOpenRequests: false,
  },
];
