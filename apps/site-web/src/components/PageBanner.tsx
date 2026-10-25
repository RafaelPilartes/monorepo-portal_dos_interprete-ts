import { AnimatedSection } from '@portal-dos-interpretes/ui/components/animated-section'
import { cn } from '@portal-dos-interpretes/ui/lib/utils'

interface PageBannerProps {
  title: string
  subtitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PageBanner({
  title,
  subtitle,
  className,
  size = 'md'
}: PageBannerProps) {
  const sizeClasses = {
    sm: 'pt-32 pb-12 md:pb-16',
    md: 'pt-32 pb-16 md:pb-24',
    lg: 'pt-32 pb-20 md:pb-32'
  }

  return (
    <section className={cn('page-banner', sizeClasses[size], className)}>
      <div className="container-wide relative z-10">
        <AnimatedSection animation="fade-up" className="text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </AnimatedSection>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
    </section>
  )
}
