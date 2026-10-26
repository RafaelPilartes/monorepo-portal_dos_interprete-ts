import { Link } from 'react-router-dom'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { AnimatedSection } from '@portal-dos-interpretes/ui/components/animated-section'
import { PageBanner } from '@/components/PageBanner'
import { VideoSection } from '@/components/VideoSection'
import { ServiceDetailsModal } from '@/components/ServiceDetailsModal'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import onlineImg from '@portal-dos-interpretes/ui/assets/services/online.jpg'
import presencialImg from '@portal-dos-interpretes/ui/assets/services/presencial.jpg'
import { formatAoa } from '@portal-dos-interpretes/i18n'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { SERVICE_EXAMPLES, SERVICE_IMAGES } from '@/components/serviceContent'
import { useActiveServices, type PublicService } from '@/data/catalog'

/** "a partir de 15 000 Kz por hora" or "25 000 Kz" (catalogs.md, site-web /services). */
function priceLine(service: PublicService): string {
  const amount = formatAoa(Number(service.platform_price_aoa))
  return service.pricing_mode === 'hourly' ? `a partir de ${amount} por hora` : amount
}

const modalities = [
  {
    image: presencialImg,
    title: 'Presencial',
    description:
      'Interpretação física no local do evento ou consulta, com presença directa do intérprete.',
    features: [
      'Comunicação directa',
      'Leitura de contexto',
      'Interacção natural'
    ]
  },
  {
    image: onlineImg,
    title: 'Online',
    description:
      'Interpretação remota via videochamada, ideal para reuniões e eventos virtuais.',
    features: ['Flexibilidade horária', 'Sem deslocação', 'Gravação possível']
  }
]

export default function Services() {
  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <PageBanner
        title="Serviços de Interpretação"
        subtitle="Oferecemos intérpretes qualificados para diversas áreas e contextos, garantindo comunicação acessível em Língua Gestual Angolana."
      />

      {/* Services Grid */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <AnimatedSection animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
              Categorias de <span className="text-gradient">Serviços</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Interpretação profissional em todos os principais sectores
            </p>
          </AnimatedSection>

          <ServicesGrid />
        </div>
      </section>

      {/* Video Section - Real YouTube Video */}
      <VideoSection
        title="Como Funcionam os Serviços"
        subtitle="Veja como os nossos intérpretes actuam em diferentes contextos."
        videoUrl="https://www.youtube.com/watch?v=ScMzIvxBSi4"
        className="bg-muted/30"
      />

      {/* Modalities */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <AnimatedSection animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Modalidades de Serviço
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha a modalidade que melhor se adapta às suas necessidades
            </p>
          </AnimatedSection>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {modalities.map((modality, index) => (
              <AnimatedSection
                key={modality.title}
                animation="fade-up"
                delay={index * 100}
              >
                <div className="rounded-2xl bg-card overflow-hidden shadow-md border border-border/50 h-full">
                  {/* Modality Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={modality.image}
                      alt={modality.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-2xl font-semibold text-white mb-1">
                        {modality.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-muted-foreground mb-6">
                      {modality.description}
                    </p>
                    <ul className="space-y-2">
                      {modality.features.map(feature => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-foreground"
                        >
                          <CheckCircle2 className="h-5 w-5 text-secondary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding page-banner pt-28 relative overflow-hidden">
        <div className="container-wide text-center relative z-10">
          <AnimatedSection animation="fade-up">
            <h2 className="text-3xl font-bold text-white mb-6">
              Precisa de um Intérprete?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Submeta a sua solicitação agora e conecte-se com intérpretes
              qualificados de Língua Gestual Angolana.
            </p>
            <Button variant="secondary" size="xl" asChild>
              <Link to="/contact">
                Solicitar Intérprete
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}

function ServicesGrid() {
  const services = useActiveServices()
  if (services.isPending) {
    return (
      <div role="status" aria-label="A carregar os serviços" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => <Skeleton key={index} className="h-80 rounded-2xl" />)}
      </div>
    )
  }
  if (services.isError) {
    return (
      <div role="alert" className="mx-auto max-w-lg rounded-xl border border-border bg-muted/40 p-6 text-center">
        <p className="text-muted-foreground">Não foi possível carregar os serviços neste momento. Tenta outra vez dentro de momentos.</p>
        <Button variant="outline" className="mt-4" onClick={() => void services.refetch()}>Tentar outra vez</Button>
      </div>
    )
  }
  if (services.data.length === 0) {
    return <p className="text-center text-muted-foreground">Os serviços disponíveis aparecem aqui em breve.</p>
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {services.data.map((service, index) => {
        const image = service.icon ? SERVICE_IMAGES[service.icon] : undefined
        const examples = SERVICE_EXAMPLES[service.slug] ?? []
        const price = priceLine(service)
        return (
          <AnimatedSection key={service.id} animation="fade-up" delay={index * 100}>
            <ServiceDetailsModal service={{ slug: service.slug, image, name: service.title, description: service.description, price, examples }}>
              <div className="group rounded-2xl bg-card overflow-hidden shadow-md card-hover h-full border border-border/50 cursor-pointer">
                <div className="relative h-48 overflow-hidden bg-primary/10">
                  {image && (
                    <img
                      src={image}
                      alt={service.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-semibold text-white">{service.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-muted-foreground mb-2">{service.description}</p>
                  <p className="mb-4 text-sm font-medium text-foreground">{price}</p>
                  <ul className="space-y-2">
                    {examples.slice(0, 3).map((example) => (
                      <li key={example} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-sm text-primary font-medium group-hover:underline">Ver detalhes →</span>
                  </div>
                </div>
              </div>
            </ServiceDetailsModal>
          </AnimatedSection>
        )
      })}
    </div>
  )
}
