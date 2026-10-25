import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Building2,
  User,
  Heart,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  Star
} from 'lucide-react'

const whoCanRequest = [
  {
    icon: User,
    title: 'Pessoas Individuais',
    description:
      'Cidadãos que precisam de intérprete para consultas médicas, reuniões, entrevistas ou eventos pessoais.'
  },
  {
    icon: Building2,
    title: 'Instituições',
    description:
      'Empresas, escolas, hospitais e organizações que necessitam de serviços de interpretação.'
  },
  {
    icon: Heart,
    title: 'Projetos Sociais',
    description:
      'ONGs, associações e projetos comunitários que trabalham com a comunidade surda.'
  }
]

const benefits = [
  {
    icon: Shield,
    title: 'Intérpretes Qualificados',
    description:
      'Pode escolher intérpretes verificados com selo de qualidade ou perfil básico.'
  },
  {
    icon: Clock,
    title: 'Processo Simples',
    description:
      'Solicite um intérprete em minutos através da nossa plataforma intuitiva.'
  },
  {
    icon: Star,
    title: 'Qualidade Garantida',
    description:
      'Sistema de avaliação que assegura excelência contínua nos serviços.'
  }
]

const steps = [
  {
    number: '1',
    title: 'Crie a sua conta',
    description: 'Registe-se gratuitamente como solicitante.'
  },
  {
    number: '2',
    title: 'Preencha os detalhes',
    description: 'Indique tipo de serviço, data, hora e local.'
  },
  {
    number: '3',
    title: 'Aguarde confirmação',
    description: 'A nossa equipa atribuirá o intérprete ideal.'
  },
  {
    number: '4',
    title: 'Receba o serviço',
    description: 'O intérprete prestará o serviço conforme agendado.'
  }
]

export default function ForRequesters() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-accent via-background to-background">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
                <Building2 className="h-4 w-4" />
                <span>Para Solicitantes</span>
              </div>
              <h1 className="text-4xl font-bold text-foreground sm:text-5xl mb-6">
                Precisa de um <span className="text-gradient">Intérprete?</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Conectamos você a intérpretes qualificados de Língua Gestual
                Angolana para qualquer situação. Processo simples, rápido e com
                garantia de qualidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" asChild>
                  <Link to="/register">
                    Solicitar Intérprete
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
                <div className="relative bg-card rounded-2xl p-8 shadow-xl">
                  <h3 className="font-semibold text-foreground mb-4">
                    Exemplo de Solicitação
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">Consulta Médica</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">15 Jan 2026</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Hora:</span>
                      <span className="font-medium">10:00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Modalidade:</span>
                      <span className="font-medium">Presencial</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="inline-flex items-center gap-1 text-success font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Confirmada
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Request */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Quem Pode Solicitar?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              O nosso serviço está disponível para qualquer pessoa ou
              organização que necessite de interpretação em LGA.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {whoCanRequest.map(item => (
              <div
                key={item.title}
                className="rounded-2xl bg-card p-8 shadow-md text-center card-hover"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-accent/30">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Benefícios de Usar o Portal
              </h2>
              <div className="space-y-6">
                {benefits.map(benefit => (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      <benefit.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Processo Simplificado
              </h3>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                      {step.number}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
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
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para Começar?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Crie a sua conta gratuita e faça a sua primeira solicitação de
            intérprete em poucos minutos.
          </p>
          <Button variant="secondary" size="xl" asChild>
            <Link to="/register">
              Criar Conta Gratuita
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
