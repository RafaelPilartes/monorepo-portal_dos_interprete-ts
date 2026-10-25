import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  UserPlus,
  FileText,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  ArrowDown,
  Building2,
  HandHeart
} from 'lucide-react'
import { PageBanner } from '@/components/PageBanner'

const requesterSteps = [
  {
    icon: UserPlus,
    title: 'Crie a Sua Conta',
    description:
      'Registe-se gratuitamente como solicitante individual ou institucional.'
  },
  {
    icon: FileText,
    title: 'Faça uma Solicitação',
    description:
      'Preencha o formulário com os detalhes do serviço: data, hora, tipo e local.'
  },
  {
    icon: Users,
    title: 'Receba um Intérprete',
    description:
      'A nossa equipa atribui o intérprete mais adequado para o seu pedido.'
  },
  {
    icon: CheckCircle,
    title: 'Serviço Realizado',
    description: 'O intérprete presta o serviço conforme combinado.'
  },
  {
    icon: Star,
    title: 'Avalie a Experiência',
    description:
      'Partilhe o seu feedback para ajudar a manter a qualidade do portal.'
  }
]

const interpreterSteps = [
  {
    icon: UserPlus,
    title: 'Crie o Seu Perfil',
    description:
      'Registe-se como intérprete e complete o seu perfil profissional.'
  },
  {
    icon: FileText,
    title: 'Envie Documentação',
    description:
      'Submeta certificações e documentos para validação pela plataforma.'
  },
  {
    icon: CheckCircle,
    title: 'Aguarde Aprovação',
    description:
      'A equipa de especialistas analisa e valida o seu perfil profissional.'
  },
  {
    icon: Users,
    title: 'Receba Solicitações',
    description: 'Após aprovação, comece a receber pedidos de serviço.'
  },
  {
    icon: Star,
    title: 'Construa Reputação',
    description: 'Preste serviços de qualidade e receba avaliações positivas.'
  }
]

export default function HowItWorks() {
  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <PageBanner
        title="Como Funciona"
        subtitle="Entenda o processo completo de solicitação e prestação de serviços
              de interpretação em Língua Gestual Angolana."
      />

      {/* Requester Flow */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Para Solicitantes
              </h2>
              <p className="text-muted-foreground">
                Pessoas e instituições que precisam de intérpretes
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-8">
              {requesterSteps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div
                    className={`flex gap-6 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div className="hidden md:block md:w-1/2" />
                    <div className="relative z-10 flex-1 md:w-1/2">
                      <div
                        className="absolute left-6 top-6 h-3 w-3 rounded-full bg-primary md:left-1/2 md:-translate-x-1/2"
                        style={{
                          left: index % 2 === 0 ? '-1.125rem' : 'auto',
                          right: index % 2 !== 0 ? '-1.125rem' : 'auto'
                        }}
                      />
                      <div className="ml-12 md:ml-0 rounded-xl bg-card p-6 shadow-md">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                            <step.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-primary mb-1">
                              Passo {index + 1}
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">
                              {step.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link to="/for-requesters">
                Saiba mais sobre solicitações
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Interpreter Flow */}
      <section className="section-padding bg-accent/30">
        <div className="container-wide">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <HandHeart className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Para Intérpretes
              </h2>
              <p className="text-muted-foreground">
                Profissionais de Língua Gestual Angolana que querem ser
                verificados e credenciados pelo Portal
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            {interpreterSteps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="rounded-xl bg-card p-6 shadow-md h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground/30">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < interpreterSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="secondary" size="lg" asChild>
              <Link to="/for-interpreters">
                Tornar-me intérprete
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Grace Mind Role */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-6">
              <HandHeart className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              O Papel da Plataforma
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              O Portal dos Intérpretes é responsável por garantir a qualidade,
              ética e profissionalismo de todos os serviços prestados através do
              portal,{' '}
              <span className="text-secondary">
                por intérpretes verificados
              </span>
              .
            </p>
            <div className="grid gap-4 sm:grid-cols-3 text-left">
              {[
                {
                  title: 'Validação',
                  desc: 'Verificamos credenciais e competências dos intérpretes'
                },
                {
                  title: 'Atribuição',
                  desc: 'Conectamos o intérprete ideal para cada serviço'
                },
                {
                  title: 'Qualidade',
                  desc: 'Monitorizamos e garantimos padrões de excelência'
                }
              ].map(item => (
                <div key={item.title} className="rounded-lg bg-accent p-4">
                  <h3 className="font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
