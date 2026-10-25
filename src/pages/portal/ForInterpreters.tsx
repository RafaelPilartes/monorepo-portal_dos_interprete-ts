import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  HandHeart,
  FileCheck,
  Shield,
  ArrowRight,
  CheckCircle2,
  Award,
  Users,
  BookOpen
} from 'lucide-react'

const requirements = [
  'Fluência em Língua Gestual Angolana',
  'Formação ou experiência comprovada como intérprete',
  'Documentos de identificação válidos',
  'Compromisso com o código de ética profissional',
  'Disponibilidade para formação contínua'
]

const validationSteps = [
  {
    icon: FileCheck,
    title: 'Submissão de Documentos',
    description:
      'Envie os seus certificados, diplomas e documentos de identificação.'
  },
  {
    icon: Users,
    title: 'Avaliação Técnica',
    description:
      'A plataforma analisa e valida as suas competências e experiência.'
  },
  {
    icon: Award,
    title: 'Aprovação Final',
    description:
      'Após validação, o seu perfil é aprovado e você começa a receber serviços.'
  }
]

const ethicsCode = [
  {
    title: 'Confidencialidade',
    description:
      'Manter sigilo absoluto sobre toda informação obtida durante a interpretação.'
  },
  {
    title: 'Imparcialidade',
    description:
      'Interpretar fielmente sem adicionar opiniões ou julgamentos pessoais.'
  },
  {
    title: 'Profissionalismo',
    description:
      'Manter conduta profissional, pontualidade e apresentação adequada.'
  },
  {
    title: 'Competência',
    description:
      'Aceitar apenas serviços para os quais possui qualificação adequada.'
  }
]

const benefits = [
  {
    icon: Users,
    title: 'Rede de Contactos',
    description:
      'Conecte-se a instituições e pessoas que precisam dos seus serviços.'
  },
  {
    icon: BookOpen,
    title: 'Formação Contínua',
    description:
      'Acesso a oportunidades de capacitação e desenvolvimento profissional.'
  },
  {
    icon: Shield,
    title: 'Apoio Institucional',
    description:
      'Suporte institucional em questões profissionais e técnicas.'
  },
  {
    icon: Award,
    title: 'Reconhecimento',
    description:
      'Construa a sua reputação através de avaliações e feedback positivo.'
  }
]

export default function ForInterpreters() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-accent via-background to-background">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary mb-6">
                <HandHeart className="h-4 w-4" />
                <span>Para Intérpretes</span>
              </div>
              <h1 className="text-4xl font-bold text-foreground sm:text-5xl mb-6">
                Junte-se à Nossa{' '}
                <span className="text-gradient">Rede de Intérpretes</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Faça parte de uma comunidade de profissionais comprometidos com
                a inclusão e acessibilidade. Conecte-se a oportunidades e
                construa a sua carreira como intérprete de LGA.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="hero"
                  className="bg-primary hover:bg-secondary/90"
                  asChild
                >
                  <Link to="/register">
                    Criar Perfil
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-3xl blur-3xl" />
                <div className="relative bg-card rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                      <HandHeart className="h-8 w-8 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Maria Silva
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Intérprete LGA
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Perfil Verificado</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-4 w-4 text-primary" />
                      <span>5 Anos de Experiência</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      <span>120+ Serviços Realizados</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg
                        key={star}
                        className="h-5 w-5 text-warning"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm font-medium text-foreground">
                      4.9
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Requisitos Mínimos
              </h2>
              <p className="text-muted-foreground mb-8">
                Para fazer parte da nossa rede de intérpretes, é necessário
                cumprir os seguintes requisitos:
              </p>
              <ul className="space-y-4">
                {requirements.map(req => (
                  <li key={req} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">
                Processo de Validação
              </h3>
              {validationSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary flex-shrink-0">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-secondary mb-1">
                      Passo {index + 1}
                    </div>
                    <h4 className="font-medium text-foreground mb-1">
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ethics Code */}
      <section className="section-padding bg-accent/30">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Código de Ética
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Todos os intérpretes do portal comprometem-se a seguir rigorosos
              princípios éticos.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ethicsCode.map(item => (
              <div
                key={item.title}
                className="rounded-xl bg-card p-6 shadow-md"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Benefícios de Fazer Parte
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map(benefit => (
              <div
                key={benefit.title}
                className="rounded-xl bg-card p-6 shadow-md card-hover text-center"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <benefit.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-secondary text-secondary-foreground">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para Começar?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Crie o seu perfil profissional e comece a fazer parte da nossa rede
            de intérpretes qualificados.
          </p>
          <Button
            variant="default"
            size="xl"
            className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90"
            asChild
          >
            <Link to="/register">
              Criar Perfil Profissional
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
