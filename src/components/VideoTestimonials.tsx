import { useState } from 'react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { Play, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  name: string;
  context: string;
  videoUrl: string;
  thumbnail?: string;
}

interface VideoTestimonialsProps {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
  className?: string;
}

export function VideoTestimonials({
  title = "Testemunhos",
  subtitle = "Veja o que dizem sobre os nossos serviços",
  testimonials,
  className = ""
}: VideoTestimonialsProps) {
  const [activeVideo, setActiveVideo] = useState<Testimonial>(testimonials[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video embed URL
  const getEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&autoplay=1`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    return url;
  };

  // Get thumbnail URL (YouTube auto-generates thumbnails)
  const getThumbnail = (video: Testimonial) => {
    if (video.thumbnail) return video.thumbnail;
    const youtubeMatch = video.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const handleVideoSelect = (video: Testimonial) => {
    setActiveVideo(video);
    setIsPlaying(false);
  };

  if (!testimonials.length) return null;

  return (
    <section className={cn("section-padding bg-muted/30", className)}>
      <div className="container-wide">
        <AnimatedSection animation="fade-up" className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={100}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Video Player - Left Column (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-xl">
                {/* Video Player */}
                <div className="relative aspect-video bg-muted">
                  {isPlaying ? (
                    <iframe
                      src={getEmbedUrl(activeVideo.videoUrl)}
                      title={activeVideo.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  ) : (
                    <div 
                      className="absolute inset-0 cursor-pointer group"
                      onClick={() => setIsPlaying(true)}
                    >
                      {/* Thumbnail or gradient background */}
                      {getThumbnail(activeVideo) ? (
                        <img 
                          src={getThumbnail(activeVideo)!} 
                          alt={activeVideo.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                      
                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-20 w-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <Play className="h-10 w-10 text-primary ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {activeVideo.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeVideo.context}
                  </p>
                </div>
              </div>
            </div>

            {/* Video List - Right Column (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl bg-card border border-border/50 shadow-xl h-full max-h-[500px] lg:max-h-[600px] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <h4 className="font-semibold text-foreground">
                    Mais Testemunhos ({testimonials.length})
                  </h4>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {testimonials.map((video) => {
                    const isActive = video.id === activeVideo.id;
                    const thumbnail = getThumbnail(video);
                    
                    return (
                      <button
                        key={video.id}
                        onClick={() => handleVideoSelect(video)}
                        className={cn(
                          "w-full flex gap-3 p-3 rounded-xl text-left transition-all duration-200",
                          isActive 
                            ? "bg-primary/10 ring-2 ring-primary/50" 
                            : "hover:bg-muted/70"
                        )}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {thumbnail ? (
                            <img 
                              src={thumbnail} 
                              alt={video.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                          )}
                          
                          {/* Small play icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-white/80 flex items-center justify-center">
                              <Play className="h-4 w-4 text-primary ml-0.5" />
                            </div>
                          </div>
                          
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute inset-0 ring-2 ring-primary rounded-lg" />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h5 className={cn(
                            "font-medium text-sm line-clamp-1 mb-1",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {video.name}
                          </h5>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {video.context}
                          </p>
                        </div>
                        
                        {/* Arrow for active */}
                        {isActive && (
                          <ChevronRight className="h-5 w-5 text-primary flex-shrink-0 self-center" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
