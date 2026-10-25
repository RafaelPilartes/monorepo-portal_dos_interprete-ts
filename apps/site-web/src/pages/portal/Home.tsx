import { registerUrl } from '@/lib/links'
import { Link } from 'react-router-dom'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { AnimatedSection } from '@portal-dos-interpretes/ui/components/animated-section'
import { InterpretersCarousel } from '@/components/InterpretersCarousel'
import { VideoTestimonials } from '@/components/VideoTestimonials'
import { AboutSection } from '@/components/AboutSection'
import { interpreters } from '@portal-dos-interpretes/features/mocks/interpretersMocks'
import heroBgImage from '@portal-dos-interpretes/ui/assets/hero-bg.png'
import heroFgImage from '@portal-dos-interpretes/ui/assets/hero-fg.png'
import {
  Users,
  Heart,
  Shield,
  ArrowRight,
  CheckCircle2,
  HandHeart,
  MessageCircle,
  Award,
  GraduationCap,
  HeartPulse,
  Scale,
  Ticket,
  Church,
  Monitor,
  ChevronRight,
  Building2,
  Landmark,
  Briefcase
} from 'lucide-react'

// Real YouTube testimonials - Sign language and accessibility related videos
const testimonials = [
  {
    id: '1',
    name: 'Escola Primária São Paulo',
    context:
      'Parceria educacional - Interpretação para alunos surdos durante todo o ano lectivo',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
  },
  {
    id: '2',
    name: 'Hospital Josina Machel',
    context:
      'Serviços de interpretação médica - Garantindo acesso à saúde para pacientes surdos',
    videoUrl: 'https://www.youtube.com/watch?v=0FcwzMq4iWg'
  },
  {
    id: '3',
    name: 'Ministério da Justiça',
    context: 'Interpretação jurídica - Acesso à justiça para cidadãos surdos',
    videoUrl: 'https://www.youtube.com/watch?v=EhRTVxGhH-g'
  },
  {
    id: '6',
    name: 'Maria Santos - Estudante Universitária',
    context:
      'Testemunho pessoal - Como a interpretação mudou a minha vida académica',
    videoUrl: 'https://www.youtube.com/watch?v=1WpKLnR2jdQ'
  }
]

const steps = [
  {
    number: '01',
    title: 'Registe-se',
    description: 'Crie a sua conta de forma rápida e segura.',
    icon: Users
  },
  {
    number: '02',
    title: 'Solicite ou Aceite',
    description:
      'Encontre intérpretes ou serviços baseados na localização e necessidade.',
    icon: MessageCircle
  },
  {
    number: '03',
    title: 'Conecte-se',
    description: 'Plataforma assegura excelência e conexão em tempo real.',
    icon: HandHeart
  }
]

const services = [
  { name: 'Educação', icon: GraduationCap },
  { name: 'Saúde', icon: HeartPulse },
  { name: 'Jurídico', icon: Scale },
  { name: 'Eventos', icon: Ticket },
  { name: 'Religioso', icon: Church },
  { name: 'Online', icon: Monitor }
]

const values = [
  {
    icon: Shield,
    title: 'Qualidade Garantida',
    description:
      'Intérpretes validados e com credenciação rigorosamente verificada.'
  },
  {
    icon: Heart,
    title: 'Impacto Social',
    description:
      'Promovemos a inclusão integral para a comunidade surda angolana.'
  },
  {
    icon: Award,
    title: 'Ética Profissional',
    description:
      'Código de conduta para assegurar um atendimento de excelência.'
  }
]

const stats = [
  { value: '50+', label: 'Intérpretes' },
  { value: '1.2k', label: 'Serviços' },
  { value: '98%', label: 'Satisfação' },
  { value: '18', label: 'Províncias' }
]

const partners = [
  { name: 'Ministério da Educação', icon: Landmark },
  { name: 'Saúde Angola', icon: HeartPulse },
  { name: 'Sindicato', icon: Briefcase },
  { name: 'Empresas Top 50', icon: Building2 }
]

export default function PortalHome() {
  return (
    <div className="flex flex-col bg-background selection:bg-primary/20">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-28 pb-10">
        {/* Background Image with Deep Premium Overlay */}
        <div className="absolute inset-0">
          <img
            src={heroBgImage}
            alt="Ambiente Profissional de Trabalho"
            className="w-full h-full object-cover object-center scale-105"
          />
          {/* Multiply blend mode to deepen colors, and gradient to ensure text readability */}
          <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
        </div>

        {/* Subtle grid background to keep the architectural feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        {/* Glowing backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/30 blur-[120px] rounded-full opacity-40 pointer-events-none mix-blend-screen" />

        {/* Content */}
        <div className="container-wide relative z-20 flex flex-col items-center text-center mt-6">
          <AnimatedSection delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-xl px-4 py-1.5 text-sm font-medium text-white/80 border border-white/10 mb-8 shadow-2xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              Hub Nacional de Língua Gestual Angolana
            </div>
          </AnimatedSection>

          <AnimatedSection
            animation="scale-in"
            delay={300}
            className="max-w-5xl mx-auto"
          >
            <h1 className="text-5xl font-extrabold tracking-tighter text-white sm:text-7xl lg:text-[7.5rem] leading-[0.95] mb-6">
              Acesso Universal.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-pink-400">
                Sem Barreiras.
              </span>
            </h1>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={500}>
            <p className="mt-4 text-lg text-slate-400 md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
              O Portal dos Intérpretes conecta instituições e cidadãos a
              intérpretes de LGA certificados, garantindo excelência e equidade
              na comunicação.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={700}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="xl"
                className="bg-white text-slate-950 hover:bg-slate-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] h-14 px-8 rounded-full font-semibold transition-all duration-300 hover:scale-105"
                asChild
              >
                <Link to="/services">
                  Solicitar Intérprete
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="h-14 px-8 rounded-full border-white/10 text-white bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-300"
                asChild
              >
                <Link to="/for-interpreters">Portal do Profissional</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>

        {/* Floating Perspective Image Mockup / Visual */}
        <AnimatedSection
          animation="fade-up"
          delay={900}
          className="relative z-10 w-full max-w-6xl mx-auto mt-20 px-4"
        >
          <div className="relative rounded-t-[2.5rem] overflow-hidden border-t border-x border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] bg-slate-900 aspect-[21/9] sm:aspect-[21/7]">
            {/* Dark gradient overlay for the image window */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10 pointer-events-none" />
            
            <img
              src={heroFgImage}
              alt="Intérprete comunicando no formato principal"
              className="w-full h-full object-cover opacity-90 scale-105 hover:scale-100 transition-transform duration-1000"
            />

            {/* Stats Overlay inside the image window */}
            <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 z-20 flex justify-center px-4">
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 p-6 sm:p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
                {stats.map(stat => (
                  <div key={stat.label} className="flex flex-col items-center">
                    <span className="text-4xl sm:text-5xl font-bold text-white tracking-tighter">
                      {stat.value}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-widest mt-1 opacity-80">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Trusted By Marquee Section (New) */}
      <section className="border-b border-border bg-muted/20 py-10">
        <div className="container-wide flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            Parceiros Institucionais
          </p>
          <div className="flex w-full overflow-hidden">
            <div className="flex w-full items-center justify-between opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {partners.map(partner => (
                <div
                  key={partner.name}
                  className="flex items-center gap-2 group cursor-default"
                >
                  <partner.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                  <span className="font-semibold text-foreground">
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Quick View (Upgraded to Cards) */}
      <section className="section-padding relative">
        <div className="container-wide">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Áreas de Especialidade
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Onde a comunicação faz a diferença no dia a dia.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map((service, index) => (
              <AnimatedSection
                key={service.name}
                animation="fade-up"
                delay={index * 50}
              >
                <Link
                  to="/services"
                  className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card p-6 shadow-sm border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <service.icon className="h-8 w-8" />
                  </div>
                  <span className="font-medium text-foreground">
                    {service.name}
                  </span>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <AboutSection
        videoUrl="https://www.youtube.com/watch?v=ScMzIvxBSi4"
        className="bg-muted/30"
      />

      {/* How it Works / Modern Timeline Design */}
      <section className="section-padding bg-background relative border-t border-border/50">
        <div className="container-wide">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl text-gradient">
              O Fluxo Perfeito
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Tecnologia e empatia unidas para conectar as partes em instantes.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-[4.5rem] left-20 right-20 h-0.5 bg-gradient-to-r from-border via-primary/30 to-border" />

            {steps.map((step, index) => (
              <AnimatedSection
                key={step.number}
                animation="fade-up"
                delay={index * 150}
              >
                <div className="flex flex-col items-center text-center group">
                  <div className="relative z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-card border-2 border-primary/10 shadow-xl group-hover:border-primary/50 group-hover:scale-105 transition-all duration-500">
                    <step.icon className="h-10 w-10 text-primary" />
                    <span className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white shadow-lg">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground max-w-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 h-12"
              asChild
            >
              <Link to="/how-it-works">
                Saber Mais
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Interpreters Carousel */}
      <InterpretersCarousel
        interpreters={interpreters}
        title="O Talento Nacional"
        subtitle="Conheça alguns dos profissionais de LGA que certificam a nossa qualidade"
      />

      {/* Values Section (Upgraded layout) */}
      <section className="section-padding bg-muted/20 border-y border-border/50">
        <div className="container-wide">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <AnimatedSection animation="slide-left">
              <div className="inline-block rounded-xl bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-6">
                Padrão de Qualidade
              </div>
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl mb-6 leading-tight">
                Integridade no Câmbio Tácito
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Asseguramos uma ponte de comunicação livre de ruídos. A Academia
                Grace Mind atesta o nosso padrão, submetendo cada profissional a
                uma avaliação técnica e ética implacável.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Auditoria Técnica',
                  'Background Check',
                  'Educação Contínua',
                  'Classificação Dupla'
                ].map((item, index) => (
                  <AnimatedSection
                    key={item}
                    animation="fade-up"
                    delay={index * 50}
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
                      <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0" />
                      <span className="text-sm font-semibold text-foreground">
                        {item}
                      </span>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection animation="slide-right" className="grid gap-6">
              {values.map(value => (
                <div
                  key={value.title}
                  className="group flex gap-5 rounded-2xl bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-border/30"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-2">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              ))}
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Video Testimonials Section */}
      <VideoTestimonials
        title="Histórias Reais"
        subtitle="Testemunhos de impacto sobre vidas mudadas pela inclusão corporativa e social."
        testimonials={testimonials}
      />

      {/* Premium CTA Section */}
      <section className="relative overflow-hidden bg-primary py-24">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -mt-48 -ml-32 h-96 w-96 rounded-full bg-secondary/30 blur-3xl opacity-75 animate-pulse" />

        <div className="container-wide relative z-10">
          <AnimatedSection
            animation="fade-up"
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="text-3xl font-extrabold text-white sm:text-5xl mb-6">
              Participe da Inclusão
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-12 font-light">
              Estamos a construir um acesso contínuo e digno a serviços
              fundamentais. Seja o nosso próximo utente ou parceiro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button
                size="xl"
                className="h-14 px-8 rounded-xl bg-white text-primary hover:bg-slate-100 shadow-xl shadow-black/10 font-bold"
                asChild
              >
                <a href={registerUrl()}>
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="h-14 px-8 rounded-xl border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link to="/contact">Falar com Consultor</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
