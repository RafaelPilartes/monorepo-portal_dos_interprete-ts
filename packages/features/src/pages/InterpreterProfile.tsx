import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { AnimatedSection } from '@portal-dos-interpretes/ui/components/animated-section'
import { RequestServiceModal } from '../components/RequestServiceModal'
import { interpreters } from '../mocks/interpretersMocks'
import { cn } from '@portal-dos-interpretes/ui/lib/utils'
import {
  ArrowLeft,
  MapPin,
  Video,
  Star,
  Shield,
  ShieldCheck,
  Clock,
  Languages,
  Award,
  CheckCircle2,
  Heart,
  Calendar,
  Send,
  GraduationCap,
  Briefcase,
  FileText,
  Play,
  MessageSquare,
  User,
  Mail,
  Phone,
  ExternalLink,
  Building,
  ChevronRight
} from 'lucide-react'

// Import service images
import educationImg from '@portal-dos-interpretes/ui/assets/services/education.jpg'
import healthImg from '@portal-dos-interpretes/ui/assets/services/health.jpg'
import legalImg from '@portal-dos-interpretes/ui/assets/services/legal.jpg'
import eventsImg from '@portal-dos-interpretes/ui/assets/services/events.jpg'
import religiousImg from '@portal-dos-interpretes/ui/assets/services/religious.jpg'
import onlineImg from '@portal-dos-interpretes/ui/assets/services/online.jpg'
import presencialImg from '@portal-dos-interpretes/ui/assets/services/presencial.jpg'

// Map areas to images
const areaImages: Record<string, string> = {
  Educação: educationImg,
  Saúde: healthImg,
  Jurídico: legalImg,
  Eventos: eventsImg,
  Religioso: religiousImg,
  Empresarial: eventsImg,
  Conferências: eventsImg,
  Médico: healthImg,
  Hospitalar: healthImg,
  default: educationImg
}

// Tab definitions
type TabId =
  | 'overview'
  | 'experience'
  | 'services'
  | 'content'
  | 'reviews'
  | 'contact'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string | undefined }>
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Visão Geral', icon: User },
  { id: 'experience', label: 'Experiência', icon: Briefcase },
  { id: 'services', label: 'Serviços', icon: Award },
  { id: 'content', label: 'Conteúdos', icon: Play },
  { id: 'reviews', label: 'Avaliações', icon: MessageSquare },
  { id: 'contact', label: 'Contacto', icon: Mail }
]

export default function InterpreterProfile() {
  const { slug } = useParams<{ slug: string }>()
  const interpreter = interpreters.find(i => i.slug === slug)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  if (!interpreter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
          <Shield className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Perfil não encontrado
        </h1>
        <p className="text-muted-foreground mb-8">
          O intérprete que procura não foi encontrado ou já não está disponível.
        </p>
        <Button asChild>
          <Link to="/interpreters">
            <ArrowLeft className="h-4 w-4" />
            Voltar à lista
          </Link>
        </Button>
      </div>
    )
  }

  const modalityInfo = {
    presencial: {
      label: 'Presencial',
      icon: MapPin,
      color: 'bg-primary/10 text-primary'
    },
    online: {
      label: 'Online',
      icon: Video,
      color: 'bg-secondary/10 text-secondary'
    },
    ambos: {
      label: 'Híbrido',
      icon: MapPin,
      color: 'bg-primary/10 text-primary'
    }
  }

  const {
    label: modalityLabel,
    icon: ModalityIcon
  } = modalityInfo[interpreter.modality]

  // Handler for tab changes
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
  }

  // Get YouTube embed URL
  const getEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`
    }
    return url
  }

  return (
    <div className="flex flex-col bg-background">
      {/* Profile Banner */}
      <section className="relative page-banner pt-28 pb-12">
        {/* Ambient photo glow behind the banner gradient */}
        <div className="absolute inset-0 opacity-15 mix-blend-soft-light pointer-events-none">
          <img
            src={interpreter.photo}
            className="w-full h-full object-cover blur-[40px] scale-110"
            alt=""
          />
        </div>
        {/* Bottom fade into page background */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient to-transparent" />

        <div className="container-wide relative z-10">
          <Link
            to="/interpreters"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Lista de Profissionais
          </Link>

          <div className="flex flex-col">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-sm font-semibold text-white/90 mb-4 border border-white/10 w-fit">
              <ModalityIcon className="h-4 w-4" />
              {modalityLabel}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-2">
              {interpreter.name}
            </h1>
            <p className="text-lg md:text-xl font-light text-white/70">
              Especialista em{' '}
              <span className="font-medium text-white/90">
                {interpreter.specialty}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Main Profile Content */}
      <div className="relative pb-24 mt-16 z-20">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left Sidebar (Sticky Photo & CTA) */}
            <AnimatedSection
              animation="fade-up"
              className="lg:col-span-4 lg:sticky lg:top-28 space-y-6"
            >
              <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-xl flex flex-col">
                {/* Photo */}
                <div className="relative aspect-square w-full">
                  <img
                    src={interpreter.photo}
                    alt={interpreter.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Badges over photo */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    {interpreter.verified && (
                      <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                        <ShieldCheck className="h-4 w-4 text-white" />
                        <span className="text-xs font-semibold text-white">
                          Verificado
                        </span>
                      </div>
                    )}
                    {interpreter.rating && (
                      <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                        <span className="text-xs font-bold text-white">
                          {interpreter.rating.toFixed(1)}
                        </span>
                        {interpreter.reviews && (
                          <span className="text-xs text-white/70">
                            ({interpreter.reviews.length})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info below photo */}
                <div className="p-5 flex flex-col gap-4">
                  {/* Quick stats row */}
                  <div className="grid grid-cols-2 gap-3">
                    {interpreter.experience && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50">
                        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            Experiência
                          </p>
                          <p className="text-sm font-semibold text-foreground truncate">
                            {interpreter.experience}
                          </p>
                        </div>
                      </div>
                    )}
                    {interpreter.languages && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50">
                        <Languages className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            Idiomas
                          </p>
                          <p
                            className="text-sm font-semibold text-foreground truncate"
                            title={interpreter.languages.join(', ')}
                          >
                            {interpreter.languages.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <RequestServiceModal interpreterName={interpreter.name}>
                    <Button className="w-full h-12 rounded-xl font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg">
                      <Send className="h-4 w-4 mr-2" />
                      Solicitar Orçamento
                    </Button>
                  </RequestServiceModal>
                </div>
              </div>
            </AnimatedSection>

            {/* Right Main Content */}
            <AnimatedSection
              animation="fade-up"
              delay={100}
              className="lg:col-span-8"
            >
              {/* Tab Navigation */}
              <div
                className="w-full flex gap-1 overflow-x-auto bg-muted/50 p-1.5 rounded-xl mb-8 border border-border/50"
                role="tablist"
              >
                {tabs.map(tab => {
                  const Icon = tab.icon
                  const isActiveTab = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActiveTab}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                        isActiveTab
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Tab Panels */}
              <div className="min-h-[400px]">
                {/* ===== OVERVIEW TAB ===== */}
                <div
                  role="tabpanel"
                  id="panel-overview"
                  aria-labelledby="tab-overview"
                  hidden={activeTab !== 'overview'}
                  className={cn(
                    activeTab === 'overview' ? 'animate-fade-in' : ''
                  )}
                >
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Bio */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-primary" />
                          Sobre o Intérprete
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {interpreter.bio}
                        </p>
                      </div>

                      {/* Specialties */}
                      {interpreter.specialties &&
                        interpreter.specialties.length > 0 && (
                          <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Award className="h-4 w-4 text-primary" />
                              Especialidades
                            </h2>
                            <div className="flex flex-wrap gap-2">
                              {interpreter.specialties.map(spec => (
                                <Badge
                                  key={spec}
                                  variant="outline"
                                  className="py-1.5 px-3 text-xs font-medium"
                                >
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Areas */}
                      {interpreter.areas && interpreter.areas.length > 0 && (
                        <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                          <h2 className="text-base font-semibold text-foreground mb-3">
                            Áreas de Actuação
                          </h2>
                          <div className="flex flex-wrap gap-2">
                            {interpreter.areas.map(area => (
                              <Badge
                                key={area}
                                variant="outline"
                                className="py-1.5 px-3 text-xs font-medium"
                              >
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Languages */}
                      {interpreter.languages &&
                        interpreter.languages.length > 0 && (
                          <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Languages className="h-4 w-4 text-primary" />
                              Idiomas & Especializações
                            </h2>
                            <div className="flex flex-wrap gap-2">
                              {interpreter.languages.map(lang => (
                                <Badge
                                  key={lang}
                                  variant="outline"
                                  className="py-1.5 px-3 text-xs font-medium"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {lang}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Modality & Availability */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Modalidade & Disponibilidade
                        </h2>

                        <div className="flex flex-wrap gap-2 mb-5">
                          {(interpreter.modality === 'presencial' ||
                            interpreter.modality === 'ambos') && (
                            <Badge
                              variant="outline"
                              className="py-1.5 px-3 text-xs font-medium"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              Presencial
                            </Badge>
                          )}
                          {(interpreter.modality === 'online' ||
                            interpreter.modality === 'ambos') && (
                            <Badge
                              variant="outline"
                              className="py-1.5 px-3 text-xs font-medium"
                            >
                              <Video className="h-3 w-3 mr-1" />
                              Online
                            </Badge>
                          )}
                        </div>

                        {interpreter.availability ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(interpreter.availability).map(
                              ([day, available]) => (
                                <div
                                  key={day}
                                  className={cn(
                                    'rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors',
                                    available
                                      ? 'bg-primary/5 text-primary border border-primary/20'
                                      : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  <span className="capitalize">{day}</span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="py-1.5 px-3 text-xs font-medium"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Actualmente Disponível
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== EXPERIENCE TAB ===== */}
                <div
                  role="tabpanel"
                  id="panel-experience"
                  aria-labelledby="tab-experience"
                  hidden={activeTab !== 'experience'}
                  className={cn(
                    activeTab === 'experience' ? 'animate-fade-in' : ''
                  )}
                >
                  {activeTab === 'experience' && (
                    <div className="space-y-6">
                      {/* Education */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          Formação Académica
                        </h2>
                        {interpreter.education &&
                        interpreter.education.length > 0 ? (
                          <div className="space-y-6">
                            {interpreter.education.map((edu, index) => (
                              <div
                                key={index}
                                className="relative pl-8 pb-6 last:pb-0 border-l-2 border-primary/30 last:border-l-0"
                              >
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                                <div className="bg-muted/50 rounded-xl p-4">
                                  <h3 className="font-semibold text-foreground">
                                    {edu.degree}
                                  </h3>
                                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                    <Building className="h-4 w-4" />
                                    <span>{edu.institution}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {edu.year}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Informações de formação não disponíveis.
                          </p>
                        )}
                      </div>

                      {/* Certifications */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          Certificações
                        </h2>
                        {interpreter.certifications &&
                        interpreter.certifications.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {interpreter.certifications.map((cert, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl"
                              >
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Award className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground">
                                    {cert.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {cert.issuer}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {cert.year}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Nenhuma certificação registrada.
                          </p>
                        )}
                      </div>

                      {/* Professional Experience */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          Experiência Profissional
                        </h2>
                        {interpreter.experience ? (
                          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {interpreter.experience}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                de experiência em interpretação profissional
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Informações de experiência não disponíveis.
                          </p>
                        )}
                      </div>

                      {/* Grace Mind Validation */}
                      {interpreter.verified && (
                        <div className="rounded-2xl bg-muted/30 p-6 border border-border/50">
                          <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground mb-1">
                                Credenciação Validada
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Este intérprete passou pelo processo de
                                validação institucional, que inclui verificação
                                de documentos, avaliação de competências
                                técnicas e compromisso com o código de ética
                                profissional.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ===== SERVICES TAB ===== */}
                <div
                  role="tabpanel"
                  id="panel-services"
                  aria-labelledby="tab-services"
                  hidden={activeTab !== 'services'}
                  className={cn(
                    activeTab === 'services' ? 'animate-fade-in' : ''
                  )}
                >
                  {activeTab === 'services' && (
                    <div className="space-y-6">
                      {/* Services with Images */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          Serviços Oferecidos
                        </h2>
                        {interpreter.areas && interpreter.areas.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {interpreter.areas.map(area => (
                              <div
                                key={area}
                                className="group rounded-xl overflow-hidden bg-muted/50 border border-border/50 hover:shadow-lg transition-all"
                              >
                                <div className="aspect-video overflow-hidden">
                                  <img
                                    src={areaImages[area] || areaImages.default}
                                    alt={area}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="p-4">
                                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                    {area}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Serviços de interpretação para contextos de{' '}
                                    {area.toLowerCase()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Nenhum serviço específico listado.
                          </p>
                        )}
                      </div>

                      {/* Modalities */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h2 className="text-base font-semibold text-foreground mb-4">
                          Modalidades de Atendimento
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {(interpreter.modality === 'presencial' ||
                            interpreter.modality === 'ambos') && (
                            <div className="rounded-xl overflow-hidden bg-muted/50 border border-border/50">
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={presencialImg}
                                  alt="Atendimento Presencial"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="p-4">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  Presencial
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Atendimento presencial em Luanda e outras
                                  províncias
                                </p>
                              </div>
                            </div>
                          )}
                          {(interpreter.modality === 'online' ||
                            interpreter.modality === 'ambos') && (
                            <div className="rounded-xl overflow-hidden bg-muted/50 border border-border/50">
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={onlineImg}
                                  alt="Atendimento Online"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="p-4">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                  <Video className="h-4 w-4 text-primary" />
                                  Online
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Interpretação remota via videoconferência
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing Info */}
                      <div className="rounded-2xl bg-muted/30 p-6 border border-border/50">
                        <h3 className="font-semibold text-foreground mb-2">
                          Informações de Contratação
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Para obter informações sobre valores e
                          disponibilidade, por favor entre em contacto através
                          do formulário de solicitação de serviços.
                        </p>
                        <RequestServiceModal interpreterName={interpreter.name}>
                          <Button>
                            <Send className="h-4 w-4" />
                            Solicitar Orçamento
                          </Button>
                        </RequestServiceModal>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== CONTENT TAB (Videos & Publications) ===== */}
                <div
                  role="tabpanel"
                  id="panel-content"
                  aria-labelledby="tab-content"
                  hidden={activeTab !== 'content'}
                  className={cn(
                    activeTab === 'content' ? 'animate-fade-in' : ''
                  )}
                >
                  {activeTab === 'content' && (
                    <div className="space-y-6">
                      {/* Videos */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Play className="h-4 w-4 text-primary" />
                            Vídeos
                          </h2>
                        </div>
                        {interpreter.videos && interpreter.videos.length > 0 ? (
                          <>
                            <div className="grid gap-4 sm:grid-cols-2">
                              {interpreter.videos
                                .slice(0, 4)
                                .map((video, index) => (
                                  <div
                                    key={index}
                                    className="rounded-xl bg-muted/50 overflow-hidden border border-border/50"
                                  >
                                    <div className="relative aspect-video bg-muted">
                                      {video.url ? (
                                        <iframe
                                          src={getEmbedUrl(video.url)}
                                          title={video.title}
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          className="absolute inset-0 w-full h-full"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                                          <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center">
                                            <Play className="h-7 w-7 text-primary ml-1" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-4">
                                      <h3 className="font-semibold text-foreground">
                                        {video.title}
                                      </h3>
                                      <p className="text-sm text-muted-foreground capitalize">
                                        {video.type}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            {/* Ver todos os vídeos button */}
                            {interpreter.videos.length > 0 && (
                              <div className="mt-6 text-center">
                                <Button
                                  asChild
                                  variant="outline"
                                  className="gap-2"
                                >
                                  <Link to={`/interpreters/${slug}/videos`}>
                                    <Play className="h-4 w-4" />
                                    Ver todos os vídeos (
                                    {interpreter.videos.length})
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              Nenhum vídeo disponível.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Publications */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Publicações & Artigos
                          </h2>
                        </div>
                        {interpreter.publications &&
                        interpreter.publications.length > 0 ? (
                          <>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {interpreter.publications
                                .slice(0, 3)
                                .map((pub, index) => (
                                  <Link
                                    key={index}
                                    to={`/interpreters/${slug}/articles/${index}`}
                                    className="group rounded-xl overflow-hidden bg-muted/50 border border-border/50 hover:shadow-md transition-all"
                                  >
                                    {/* Article Image */}
                                    <div className="aspect-video overflow-hidden bg-muted">
                                      <img
                                        src={`https://images.unsplash.com/photo-${index === 0 ? '1456513080510-7bf3a84b82f8' : index === 1 ? '1503676260728-1c00da094a0b' : '1434030216411-0b793f4b4173'}?w=400&h=225&fit=crop`}
                                        alt={pub.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                      />
                                    </div>
                                    <div className="p-4">
                                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                        {pub.title}
                                      </h3>
                                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                        {pub.excerpt}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                          {pub.date}
                                        </span>
                                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                                          Ler mais
                                          <ExternalLink className="h-3 w-3" />
                                        </span>
                                      </div>
                                    </div>
                                  </Link>
                                ))}
                            </div>
                            {/* Ver todos os artigos button */}
                            {interpreter.publications.length > 0 && (
                              <div className="mt-6 text-center">
                                <Button
                                  asChild
                                  variant="outline"
                                  className="gap-2"
                                >
                                  <Link to={`/interpreters/${slug}/articles`}>
                                    <FileText className="h-4 w-4" />
                                    Ver todos os artigos (
                                    {interpreter.publications.length})
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              Nenhuma publicação disponível.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== REVIEWS TAB ===== */}
                <div
                  role="tabpanel"
                  id="panel-reviews"
                  aria-labelledby="tab-reviews"
                  hidden={activeTab !== 'reviews'}
                  className={cn(
                    activeTab === 'reviews' ? 'animate-fade-in' : ''
                  )}
                >
                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      {interpreter.reviews && interpreter.reviews.length > 0 ? (
                        <>
                          {/* Reviews Summary */}
                          <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <div className="text-4xl font-bold text-foreground">
                                  {interpreter.rating?.toFixed(1)}
                                </div>
                                <div className="flex gap-1 mt-2 justify-center">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= Math.floor(interpreter.rating!)
                                          ? 'text-warning fill-warning'
                                          : 'text-muted'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {interpreter.reviews.length} avaliações
                                </p>
                              </div>
                              <div className="flex-1 pl-6 border-l border-border">
                                <p className="text-sm text-muted-foreground">
                                  Os clientes avaliam{' '}
                                  {interpreter.name.split(' ')[0]} com base em
                                  pontualidade, profissionalismo, qualidade da
                                  interpretação e comunicação.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Individual Reviews */}
                          <div className="space-y-4">
                            {interpreter.reviews.map((review, index) => (
                              <div
                                key={index}
                                className="rounded-2xl bg-card p-6 shadow-md border border-border/50"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-foreground">
                                        {review.author}
                                      </h4>
                                      <span className="text-xs text-muted-foreground">
                                        {review.date}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 mb-3">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= review.rating
                                              ? 'text-warning fill-warning'
                                              : 'text-muted'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {review.comment}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-2xl bg-muted/50 p-8 text-center">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            Nenhuma avaliação disponível ainda.
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Seja o primeiro a avaliar este intérprete após
                            utilizar os seus serviços.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ===== CONTACT TAB ===== */}
                <div
                  role="tabpanel"
                  id="panel-contact"
                  aria-labelledby="tab-contact"
                  hidden={activeTab !== 'contact'}
                  className={cn(
                    activeTab === 'contact' ? 'animate-fade-in' : ''
                  )}
                >
                  {activeTab === 'contact' && (
                    <div className="space-y-6">
                      {/* Request Service Card */}
                      <div className="rounded-2xl bg-muted/30 p-8 border border-border/50">
                        <div className="text-center mb-6">
                          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Send className="h-7 w-7 text-primary" />
                          </div>
                          <h2 className="text-xl font-bold text-foreground mb-2">
                            Solicitar Serviços de{' '}
                            {interpreter.name.split(' ')[0]}
                          </h2>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Preencha o formulário de solicitação e a equipa da
                            Grace Mind irá coordenar o serviço com{' '}
                            {interpreter.name.split(' ')[0]}.
                          </p>
                        </div>

                        <div className="flex justify-center">
                          <RequestServiceModal
                            interpreterName={interpreter.name}
                          >
                            <Button size="lg" className="shadow-lg">
                              <Send className="h-4 w-4" />
                              Solicitar Serviços
                            </Button>
                          </RequestServiceModal>
                        </div>
                      </div>

                      {/* Contact Methods */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h3 className="text-base font-semibold text-foreground mb-4">
                          Como Funciona
                        </h3>
                        <div className="space-y-4">
                          <div className="flex gap-4 p-4 bg-muted/50 rounded-xl">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-primary">1</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">
                                Submeta a Solicitação
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Preencha os detalhes do serviço que necessita
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 p-4 bg-muted/50 rounded-xl">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-primary">2</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">
                                Confirmação da Grace Mind
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                A equipa analisa e confirma a disponibilidade
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 p-4 bg-muted/50 rounded-xl">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-primary">3</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">
                                Serviço Realizado
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                O intérprete presta o serviço na data agendada
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alternative Contact */}
                      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/50">
                        <h3 className="text-base font-semibold text-foreground mb-4">
                          Contacto Alternativo
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Para questões urgentes ou informações adicionais, pode
                          contactar a Grace Mind directamente:
                        </p>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>info@gracemind.ao</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>+244 923 456 789</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom CTA Card */}
              <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground mt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Precisa de serviços de interpretação?
                    </h3>
                    <p className="text-sm opacity-90">
                      Submeta uma solicitação e a Grace Mind irá conectá-lo com{' '}
                      {interpreter.name}.
                    </p>
                  </div>
                  <RequestServiceModal interpreterName={interpreter.name}>
                    <Button variant="secondary" size="lg" className="shadow-lg">
                      <Send className="h-4 w-4" />
                      Solicitar Serviços
                    </Button>
                  </RequestServiceModal>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  )
}
