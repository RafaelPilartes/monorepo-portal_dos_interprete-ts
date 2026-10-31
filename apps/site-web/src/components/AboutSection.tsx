import { Link } from 'react-router-dom'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { AnimatedSection } from '@portal-dos-interpretes/ui/components/animated-section'
import { DecorativeBackground } from '@/components/DecorativeBackground'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

interface AboutSectionProps {
  videoUrl: string
  className?: string
}

export function AboutSection({ videoUrl, className = "" }: AboutSectionProps) {
  // Extract video ID for YouTube embeds
  const getEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`
    }
    return url
  }

  const embedUrl = getEmbedUrl(videoUrl)

  return (
    <DecorativeBackground variant="mixed" className={`section-padding ${className}`}>
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text Content - Left Side */}
          <AnimatedSection animation="slide-left" className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              Sobre Nós
            </div>
            
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl mb-6">
              Conheça o{' '}
              <span className="text-gradient">Portal dos Intérpretes</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Uma iniciativa com o apoio técnico e institucional da Academia Grace Mind. 
              O nosso Portal conecta profissionais qualificados a 
              pessoas e organizações que necessitam de serviços de interpretação.
            </p>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Com um compromisso inabalável com a qualidade e a inclusão, trabalhamos 
              para garantir que a comunidade surda angolana tenha acesso pleno à 
              comunicação em todos os contextos da vida.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                'Mais de 50 intérpretes certificados',
                'Cobertura em 18 províncias de Angola',
                'Processo rigoroso de validação',
                'Código de ética profissional'
              ].map((item, index) => (
                <AnimatedSection key={item} animation="fade-up" delay={index * 50}>
                  <li className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                </AnimatedSection>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/services">
                  Solicitar Intérprete
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/impact">
                  Ver Impacto
                </Link>
              </Button>
            </div>
          </AnimatedSection>

          {/* Video - Right Side */}
          <AnimatedSection animation="slide-right" className="order-1 lg:order-2">
            <div className="relative">
              {/* Decorative frame */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-xl" />
              
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-muted border border-border/50">
                <iframe
                  src={embedUrl}
                  title="Conheça o Portal"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                />
              </div>
              
              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-xl border border-border/50 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">+</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">1000</p>
                    <p className="text-xs text-muted-foreground">Serviços Realizados</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </DecorativeBackground>
  )
}
