import { useState } from 'react'
import { AnimatedSection } from '@portal-dos-interpretes/ui/components/animated-section'
import { PageBanner } from '@/components/PageBanner'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Play, Clock, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Tutorial, tutorials } from '@/core/mocks/portalMocks'

const categories = [
  { id: 'todos', label: 'Todos', icon: CheckCircle2 },
  { id: 'clientes', label: 'Para Clientes', icon: User },
  { id: 'interpretes', label: 'Para Intérpretes', icon: User },
  { id: 'geral', label: 'Geral', icon: CheckCircle2 }
]

export default function Tutorials() {
  const [activeCategory, setActiveCategory] = useState('todos')
  const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null)

  const filteredTutorials =
    activeCategory === 'todos'
      ? tutorials
      : tutorials.filter(t => t.category === activeCategory)

  // Extract YouTube video ID for embed
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0&autoplay=1`
    }
    return url
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'clientes':
        return 'bg-secondary/10 text-secondary'
      case 'interpretes':
        return 'bg-primary/10 text-primary'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'clientes':
        return 'Para Clientes'
      case 'interpretes':
        return 'Para Intérpretes'
      default:
        return 'Geral'
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <PageBanner
        title="Tutorias"
        subtitle="Aprenda a utilizar o Portal dos Intérpretes com os nossos vídeos explicativos. Seja cliente ou intérprete, temos conteúdos para si."
      />

      {/* Main Content */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          {/* Category Filters */}
          <AnimatedSection animation="fade-up" className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={
                    activeCategory === category.id ? 'default' : 'outline'
                  }
                  onClick={() => setActiveCategory(category.id)}
                  className="rounded-full"
                >
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.label}
                </Button>
              ))}
            </div>
          </AnimatedSection>

          {/* Selected Video Player */}
          {selectedVideo && (
            <AnimatedSection animation="scale-in" className="mb-12">
              <div className="max-w-4xl mx-auto">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-muted border border-border/50">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedVideo.videoUrl)}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedVideo.title}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {selectedVideo.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVideo(null)}
                    className="mt-4"
                  >
                    Fechar vídeo
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Tutorials Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutorials.map((tutorial, index) => (
              <AnimatedSection
                key={tutorial.id}
                animation="fade-up"
                delay={index * 50}
              >
                <div
                  className="group rounded-2xl bg-card overflow-hidden shadow-md card-hover h-full border border-border/50 cursor-pointer"
                  onClick={() => setSelectedVideo(tutorial)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Play className="h-8 w-8 text-primary ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tutorial.duration}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <Badge
                      className={`${getCategoryColor(tutorial.category)} mb-3`}
                    >
                      {getCategoryLabel(tutorial.category)}
                    </Badge>
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tutorial.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tutorial.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Empty State */}
          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum tutorial encontrado nesta categoria.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding page-banner pt-28 relative overflow-hidden">
        <div className="container-wide text-center relative z-10">
          <AnimatedSection animation="fade-up">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ainda tem dúvidas?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              A nossa equipa está disponível para ajudar. Entre em contacto
              connosco.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="secondary" size="xl" asChild>
                <Link to="/contact">
                  Fale Connosco
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="xl"
                className="text-white hover:bg-white/10"
                asChild
              >
                <Link to="/how-it-works">Como Funciona</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
