import { AnimatedSection } from '@portal-dos-interpretes/ui/components/animated-section'
import { cn } from '@portal-dos-interpretes/ui/lib/utils'

// The opening of the site's inner pages (DESIGN.md: the same calm world as the panels): a quiet,
// cool band under the fixed header, the title in ink, left-aligned, with a short brand-blue rule.
// The home keeps its own hero.

interface PageBannerProps {
  title: string
  subtitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PageBanner({ title, subtitle, className, size = 'md' }: PageBannerProps) {
  const sizeClasses = {
    sm: 'pt-28 pb-10 md:pt-32 md:pb-12',
    md: 'pt-28 pb-12 md:pt-36 md:pb-16',
    lg: 'pt-28 pb-14 md:pt-40 md:pb-20',
  }

  return (
    <section className={cn('relative border-b border-border bg-[hsl(216_33%_97.5%)] dark:bg-muted/30', sizeClasses[size], className)}>
      <div className="container-wide">
        <AnimatedSection animation="fade-up">
          <span aria-hidden="true" className="mb-5 block h-1 w-10 rounded-full bg-primary" />
          <h1 className="max-w-3xl text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-foreground [text-wrap:balance] sm:text-[2.5rem] md:text-[3rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          )}
        </AnimatedSection>
      </div>
    </section>
  )
}
