// Mock interpreters, used only by the request wizard until H5 replaces it with the directory.
export interface InterpreterEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface InterpreterCertification {
  name: string;
  issuer: string;
  year: string;
}

export interface InterpreterVideo {
  title: string;
  url: string;
  type: "apresentacao" | "trabalho" | "palestra" | "aula";
}

export interface InterpreterPublication {
  title: string;
  date: string;
  excerpt: string;
}

export interface InterpreterReview {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface InterpreterAvailability {
  weekdays: string[];
  hours: string;
  notice: string;
}

export interface InterpreterData {
  slug: string;
  name: string;
  photo: string;
  specialty: string;
  specialties?: string[];
  modality: "presencial" | "online" | "ambos";
  rating?: number;
  verified?: boolean;
  bio?: string;
  experience?: string;
  languages?: string[];
  areas?: string[];
  education?: InterpreterEducation[];
  certifications?: InterpreterCertification[];
  videos?: InterpreterVideo[];
  publications?: InterpreterPublication[];
  reviews?: InterpreterReview[];
  availability?: InterpreterAvailability;
  minimumHourlyRate?: number;
  openToNegotiation?: boolean;
}


export const interpreters: InterpreterData[] = [
  {
    slug: "maria-silva",
    name: "Maria Silva",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    specialty: "Educação e Formação",
    specialties: ["Educação", "Formação Profissional", "Conferências"],
    modality: "ambos",
    rating: 4.9,
    verified: true,
    minimumHourlyRate: 12000,
    openToNegotiation: true,
    bio: "Intérprete de Língua Gestual Angolana com mais de 8 anos de experiência em contextos educacionais. Licenciada em Educação Especial pela Universidade Agostinho Neto, dedico-me a promover a inclusão de pessoas surdas no sistema educativo angolano.",
    experience: "8 anos",
    languages: ["Português", "LGA", "Inglês"],
    areas: ["Educação", "Saúde", "Eventos"],
    education: [
      { degree: "Licenciatura em Educação Especial", institution: "Universidade Agostinho Neto", year: "2015" },
      { degree: "Pós-Graduação em Língua Gestual", institution: "Instituto Superior de Ciências da Educação", year: "2018" }
    ],
    certifications: [
      { name: "Certificação Profissional LGA - Nível Avançado", issuer: "Academia Grace Mind", year: "2020" },
      { name: "Interpretação Educacional", issuer: "Ministério da Educação", year: "2019" }
    ],
    videos: [
      { title: "Apresentação Profissional", url: "https://www.youtube.com/watch?v=ScMzIvxBSi4", type: "apresentacao" },
      { title: "Palestra sobre Inclusão Educacional", url: "https://www.youtube.com/watch?v=0FcwzMq4iWg", type: "palestra" }
    ],
    publications: [
      { title: "A Importância da LGA na Educação Angolana", date: "2023-06-15", excerpt: "Reflexão sobre o papel fundamental da Língua Gestual Angolana no sistema educativo..." },
      { title: "Desafios da Interpretação em Sala de Aula", date: "2022-11-20", excerpt: "Análise dos principais desafios enfrentados por intérpretes em contextos educacionais..." }
    ],
    reviews: [
      { author: "Escola Primária Nº 1234", rating: 5, comment: "Profissional excelente, muito dedicada e competente.", date: "2024-01-10" },
      { author: "Universidade Católica de Angola", rating: 5, comment: "Interpretação impecável durante todo o semestre.", date: "2023-12-05" }
    ],
    availability: {
      weekdays: ["Segunda", "Terça", "Quarta", "Quinta"],
      hours: "08:00 - 18:00",
      notice: "48 horas de antecedência"
    }
  },
  {
    slug: "joao-pedro-antonio",
    name: "João Pedro António",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    specialty: "Saúde e Área Médica",
    specialties: ["Saúde", "Consultas Médicas", "Hospitais"],
    modality: "presencial",
    rating: 4.8,
    verified: true,
    minimumHourlyRate: 15000,
    openToNegotiation: false,
    bio: "Especializado em interpretação na área da saúde, com formação complementar em terminologia médica. Trabalho há 6 anos com hospitais e clínicas em Luanda, garantindo que pacientes surdos tenham acesso pleno aos serviços de saúde.",
    experience: "6 anos",
    languages: ["Português", "LGA"],
    areas: ["Saúde", "Jurídico"],
    education: [
      { degree: "Curso Técnico de Intérprete de LGA", institution: "Academia Grace Mind", year: "2017" },
      { degree: "Formação em Terminologia Médica", institution: "Hospital Américo Boavida", year: "2019" }
    ],
    certifications: [
      { name: "Certificação Profissional LGA - Nível Intermédio", issuer: "Academia Grace Mind", year: "2018" },
      { name: "Interpretação em Contexto de Saúde", issuer: "Ministério da Saúde", year: "2020" }
    ],
    videos: [
      { title: "Interpretação em Contexto Hospitalar", url: "https://www.youtube.com/watch?v=EhRTVxGhH-g", type: "trabalho" }
    ],
    reviews: [
      { author: "Clínica Sagrada Esperança", rating: 5, comment: "Muito profissional e pontual.", date: "2024-01-05" }
    ],
    availability: {
      weekdays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      hours: "07:00 - 19:00",
      notice: "24 horas de antecedência"
    }
  },
  {
    slug: "ana-beatriz-fernandes",
    name: "Ana Beatriz Fernandes",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    specialty: "Eventos e Conferências",
    specialties: ["Eventos Corporativos", "Conferências", "Congressos"],
    modality: "ambos",
    rating: 5.0,
    verified: true,
    minimumHourlyRate: 20000,
    openToNegotiation: true,
    bio: "Intérprete experiente em grandes eventos e conferências internacionais. Com formação em Comunicação Social e especialização em LGA, já participei em mais de 200 eventos, incluindo conferências governamentais e corporativas.",
    experience: "10 anos",
    languages: ["Português", "LGA", "Inglês", "Francês"],
    areas: ["Eventos", "Educação", "Empresarial"],
    education: [
      { degree: "Licenciatura em Comunicação Social", institution: "Universidade Lusíada de Angola", year: "2013" },
      { degree: "Especialização em LGA", institution: "Academia Grace Mind", year: "2014" }
    ],
    certifications: [
      { name: "Certificação Profissional LGA - Nível Avançado", issuer: "Academia Grace Mind", year: "2016" },
      { name: "Interpretação de Conferências", issuer: "World Federation of the Deaf", year: "2018" }
    ],
    videos: [
      { title: "Conferência Internacional de Inclusão", url: "https://www.youtube.com/watch?v=3aQFmPPrmAM", type: "trabalho" },
      { title: "Evento Corporativo Total Energies", url: "https://www.youtube.com/watch?v=fNAv70jqIu0", type: "trabalho" }
    ],
    publications: [
      { title: "O Papel do Intérprete em Eventos Internacionais", date: "2023-09-10", excerpt: "Como garantir qualidade e profissionalismo em grandes eventos..." }
    ],
    reviews: [
      { author: "Total Energies Angola", rating: 5, comment: "Serviço excepcional em todos os nossos eventos.", date: "2024-01-15" },
      { author: "Ministério das Finanças", rating: 5, comment: "Profissionalismo de excelência.", date: "2023-11-20" }
    ],
    availability: {
      weekdays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
      hours: "Flexível",
      notice: "72 horas de antecedência"
    }
  },
  {
    slug: "carlos-manuel-teixeira",
    name: "Carlos Manuel Teixeira",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    specialty: "Área Jurídica",
    specialties: ["Tribunais", "Notariado", "Consultoria Legal"],
    modality: "presencial",
    rating: 4.7,
    verified: true,
    minimumHourlyRate: 18000,
    openToNegotiation: false,
    bio: "Formado em Direito com especialização em interpretação jurídica. Há 5 anos trabalho exclusivamente em contextos legais, garantindo que pessoas surdas tenham acesso justo ao sistema de justiça angolano.",
    experience: "5 anos",
    languages: ["Português", "LGA"],
    areas: ["Jurídico", "Governamental"],
    education: [
      { degree: "Licenciatura em Direito", institution: "Universidade Agostinho Neto", year: "2016" },
      { degree: "Curso de Intérprete Jurídico", institution: "Academia Grace Mind", year: "2018" }
    ],
    certifications: [
      { name: "Interpretação Jurídica", issuer: "Ordem dos Advogados de Angola", year: "2019" },
      { name: "Certificação Profissional LGA", issuer: "Academia Grace Mind", year: "2018" }
    ],
    reviews: [
      { author: "Tribunal Provincial de Luanda", rating: 5, comment: "Interpretação precisa e profissional.", date: "2023-12-10" }
    ],
    availability: {
      weekdays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      hours: "09:00 - 17:00",
      notice: "48 horas de antecedência"
    }
  },
  {
    slug: "lucia-esperanca-santos",
    name: "Lúcia Esperança Santos",
    photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop",
    specialty: "Religioso e Comunitário",
    specialties: ["Serviços Religiosos", "Eventos Comunitários", "Cerimónias"],
    modality: "presencial",
    rating: 4.9,
    verified: true,
    minimumHourlyRate: 8000,
    openToNegotiation: true,
    bio: "Membro ativo da comunidade surda desde jovem, dedico-me à interpretação em contextos religiosos e comunitários. Minha missão é garantir que a fé e a comunidade sejam acessíveis a todos.",
    experience: "7 anos",
    languages: ["Português", "LGA"],
    areas: ["Religioso", "Comunitário", "Educação"],
    education: [
      { degree: "Curso de Intérprete de LGA", institution: "Academia Grace Mind", year: "2016" }
    ],
    certifications: [
      { name: "Certificação em Interpretação Religiosa", issuer: "Conferência Episcopal de Angola", year: "2017" }
    ],
    reviews: [
      { author: "Igreja Nossa Senhora da Conceição", rating: 5, comment: "Dedicada e sempre disponível.", date: "2024-01-01" }
    ],
    availability: {
      weekdays: ["Domingo", "Sábado", "Quarta"],
      hours: "Flexível",
      notice: "24 horas de antecedência"
    }
  },
  {
    slug: "paulo-henrique-costa",
    name: "Paulo Henrique Costa",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    specialty: "Tecnologia e Online",
    specialties: ["Interpretação Remota", "Tecnologia", "Startups"],
    modality: "online",
    rating: 4.6,
    verified: true,
    minimumHourlyRate: 10000,
    openToNegotiation: true,
    bio: "Pioneiro em interpretação remota em Angola, especializado em contextos tecnológicos e empresariais. Formado em TI e LGA, combino tecnologia e acessibilidade para criar soluções inovadoras.",
    experience: "4 anos",
    languages: ["Português", "LGA", "Inglês"],
    areas: ["Tecnologia", "Empresarial", "Educação"],
    education: [
      { degree: "Licenciatura em Tecnologias de Informação", institution: "Universidade Metodista de Angola", year: "2018" },
      { degree: "Curso de Intérprete de LGA", institution: "Academia Grace Mind", year: "2019" }
    ],
    certifications: [
      { name: "Interpretação Remota", issuer: "Academia Grace Mind", year: "2020" }
    ],
    videos: [
      { title: "Webinar sobre Acessibilidade Digital", url: "https://www.youtube.com/watch?v=1WpKLnR2jdQ", type: "palestra" }
    ],
    reviews: [
      { author: "Startup Kuenda", rating: 5, comment: "Excelente para reuniões remotas!", date: "2023-12-20" }
    ],
    availability: {
      weekdays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      hours: "09:00 - 21:00",
      notice: "12 horas de antecedência"
    }
  },
  {
    slug: "teresa-marques-silva",
    name: "Teresa Marques Silva",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    specialty: "Educação Infantil",
    specialties: ["Educação Infantil", "Pré-escola", "Ensino Primário"],
    modality: "presencial",
    rating: 4.8,
    verified: true,
    bio: "Especializada em educação infantil e primária, com foco no desenvolvimento linguístico de crianças surdas. Trabalho com escolas em Luanda para garantir que todas as crianças tenham acesso à educação de qualidade.",
    experience: "5 anos",
    languages: ["Português", "LGA"],
    areas: ["Educação", "Infantil"],
    education: [
      { degree: "Licenciatura em Educação Infantil", institution: "Instituto Superior de Ciências da Educação", year: "2018" },
      { degree: "Curso de Intérprete de LGA", institution: "Academia Grace Mind", year: "2019" }
    ],
    certifications: [
      { name: "Educação Inclusiva", issuer: "UNICEF Angola", year: "2021" }
    ],
    reviews: [
      { author: "Colégio Angolano de Educação", rating: 5, comment: "As crianças adoram trabalhar com ela!", date: "2024-01-08" }
    ],
    availability: {
      weekdays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      hours: "08:00 - 15:00",
      notice: "48 horas de antecedência"
    }
  },
  {
    slug: "manuel-jose-ferreira",
    name: "Manuel José Ferreira",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    specialty: "Empresarial e Corporativo",
    specialties: ["Reuniões Corporativas", "Negócios", "Recursos Humanos"],
    modality: "ambos",
    rating: 4.7,
    verified: false,
    bio: "Intérprete focado no sector empresarial e corporativo. Com experiência em multinacionais, ajudo empresas a tornarem-se mais inclusivas através de serviços de interpretação de alta qualidade.",
    experience: "3 anos",
    languages: ["Português", "LGA", "Inglês"],
    areas: ["Empresarial", "Recursos Humanos", "Formação"],
    education: [
      { degree: "Licenciatura em Gestão de Empresas", institution: "Universidade Católica de Angola", year: "2019" },
      { degree: "Formação em LGA", institution: "Academia Grace Mind", year: "2020" }
    ],
    availability: {
      weekdays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      hours: "09:00 - 18:00",
      notice: "24 horas de antecedência"
    }
  },
  {
    slug: "rosa-maria-gomes",
    name: "Rosa Maria Gomes",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    specialty: "Saúde Mental",
    specialties: ["Psicologia", "Terapia", "Apoio Emocional"],
    modality: "ambos",
    rating: 4.9,
    verified: true,
    bio: "Com formação em psicologia e especialização em interpretação, dedico-me a apoiar pessoas surdas em contextos de saúde mental. A comunicação empática é fundamental para o bem-estar.",
    experience: "6 anos",
    languages: ["Português", "LGA"],
    areas: ["Saúde Mental", "Saúde", "Comunitário"],
    education: [
      { degree: "Licenciatura em Psicologia", institution: "Universidade Agostinho Neto", year: "2016" },
      { degree: "Curso de Intérprete de LGA", institution: "Academia Grace Mind", year: "2017" }
    ],
    certifications: [
      { name: "Interpretação em Contexto de Saúde Mental", issuer: "Associação de Psicólogos de Angola", year: "2020" }
    ],
    reviews: [
      { author: "Centro de Saúde Mental de Luanda", rating: 5, comment: "Sensibilidade e profissionalismo excepcionais.", date: "2023-11-15" }
    ],
    availability: {
      weekdays: ["Segunda", "Terça", "Quarta", "Quinta"],
      hours: "10:00 - 18:00",
      notice: "48 horas de antecedência"
    }
  },
  {
    slug: "antonio-fernando-dias",
    name: "António Fernando Dias",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    specialty: "Desporto e Lazer",
    specialties: ["Eventos Desportivos", "Lazer", "Turismo"],
    modality: "presencial",
    rating: 4.5,
    verified: false,
    bio: "Apaixonado por desporto e acessibilidade, especializo-me em interpretação para eventos desportivos e actividades de lazer. Quero garantir que todos possam desfrutar destes momentos.",
    experience: "2 anos",
    languages: ["Português", "LGA"],
    areas: ["Desporto", "Lazer", "Turismo"],
    education: [
      { degree: "Curso de Intérprete de LGA", institution: "Academia Grace Mind", year: "2021" }
    ],
    availability: {
      weekdays: ["Sábado", "Domingo", "Sexta"],
      hours: "Flexível",
      notice: "48 horas de antecedência"
    }
  }
];

export const featuredInterpreters = interpreters.slice(0, 8);
