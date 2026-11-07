import { AnimatedSection } from "@portal-dos-interpretes/ui/components/animated-section";

interface VideoSectionProps {
  title: string;
  subtitle?: string;
  videoUrl: string;
  poster?: string;
  className?: string;
}

export function VideoSection({ title, subtitle, videoUrl, poster, className = "" }: VideoSectionProps) {
  // Extract video ID for YouTube/Vimeo embeds
  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  const isEmbed = videoUrl.includes('youtube') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo');
  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <section className={`section-padding ${className}`}>
      <div className="container-wide">
        <AnimatedSection animation="fade-up" className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </AnimatedSection>

        <AnimatedSection animation="scale-in" delay={100}>
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-muted border border-border/50">
              {isEmbed ? (
                <iframe
                  src={embedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <video
                  controls
                  poster={poster}
                  className="absolute inset-0 w-full h-full object-cover"
                  preload="metadata"
                >
                  <source src={videoUrl} type="video/mp4" />
                  <track kind="captions" label="Português" />
                  O seu navegador não suporta a reprodução de vídeo.
                </video>
              )}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
