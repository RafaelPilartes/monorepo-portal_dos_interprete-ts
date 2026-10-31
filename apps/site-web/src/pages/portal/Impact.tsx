import { registerUrl } from '@/lib/links'
import { Link } from 'react-router-dom'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import {
  Heart,
  Users,
  Globe,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

const impactAreas = [
  {
    icon: Users,
    title: 'Inclusão Social',
    description:
      'Promovemos a participação plena da comunidade surda em todos os aspectos da sociedade angolana.',
    stats: '1000+ pessoas impactadas'
  },
  {
    icon: Heart,
    title: 'Dignidade e Respeito',
    description:
      'Garantimos que cada pessoa surda tenha acesso a comunicação digna e respeitosa.',
    stats: '100% ética profissional'
  },
  {
    icon: Globe,
    title: 'Acessibilidade Universal',
    description:
      'Trabalhamos para que serviços essenciais sejam acessíveis a todos, independente da capacidade auditiva.',
    stats: '6 áreas de atuação'
  },
  {
    icon: Target,
    title: 'Capacitação Profissional',
    description:
      'Formamos e qualificamos intérpretes, criando oportunidades de emprego e crescimento profissional.',
    stats: 'Formação contínua'
  }
]

const mission = [
  'Garantir comunicação acessível para pessoas surdas em Angola',
  'Formar intérpretes qualificados e éticos',
  'Promover a valorização da Língua Gestual Angolana',
  'Criar pontes de comunicação entre comunidades',
  'Defender os direitos linguísticos da comunidade surda'
]

const projects = [
  {
    title: 'Interpretação Comunitária',
    description:
      'Serviços gratuitos para comunidades carenciadas e projetos sociais.',
    status: 'Contínuo'
  },
  {
    title: 'Capacitação de Intérpretes',
    description:
      'Formação contínua para elevar o nível profissional dos intérpretes angolanos.',
    status: 'Permanente'
  },
  {
    title: 'Sensibilização Institucional',
    description:
      'Trabalho com instituições públicas e privadas para promover acessibilidade.',
    status: 'Em expansão'
  }
]

export default function Impact() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="section-padding page-banner pt-28">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6 bg-white">
              <Sparkles className="h-4 w-4" />
              <span>Impacto Social Real</span>
            </div>
            <h1 className="text-white text-4xl font-bold text-foreground sm:text-5xl">
              Transformando Vidas Através da{' '}
              <span className="text-secondary">Comunicação</span>
            </h1>
            <p className="mt-6 text-lg text-gray-200">
              O Portal dos Intérpretes é mais do que uma plataforma tecnológica.
              É um instrumento de mudança social que conecta pessoas e derruba
              barreiras de comunicação.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid gap-6 md:grid-cols-2">
            {impactAreas.map(area => (
              <div
                key={area.title}
                className="rounded-2xl bg-card p-8 shadow-md card-hover"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <area.icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {area.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {area.description}
                    </p>
                    <div className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                      {area.stats}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">A Nossa Missão</h2>
              <p className="text-lg opacity-90 mb-8">
                O Portal dos Intérpretes dedica-se à organização e promoção da
                inclusão e acessibilidade para a comunidade surda angolana,
                conectando profissionais qualificados a instituições e pessoas
                através da Língua Gestual Angolana. Apoiado estrategicamente
                pela Academia Grace Mind.
              </p>
              <ul className="space-y-3">
                {mission.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {projects.map(project => (
                <div
                  key={project.title}
                  className="rounded-xl bg-primary-foreground/10 p-6 backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">{project.title}</h3>
                      <p className="text-sm opacity-80">
                        {project.description}
                      </p>
                    </div>
                    <span className="text-xs font-medium bg-primary-foreground/20 rounded-full px-2 py-1 whitespace-nowrap">
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="section-padding bg-accent/30">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              A Nossa Visão
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Sonhamos com uma Angola onde a comunicação não conhece barreiras.
              Onde cada pessoa surda tem acesso pleno a serviços, educação,
              trabalho e participação social. Onde a Língua Gestual Angolana é
              reconhecida, valorizada e respeitada.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <a href={registerUrl()}>
                  Junte-se a Nós
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Saiba Mais</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
