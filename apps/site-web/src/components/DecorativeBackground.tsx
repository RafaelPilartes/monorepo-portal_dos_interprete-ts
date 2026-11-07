import { cn } from '@portal-dos-interpretes/ui/lib/utils'

interface DecorativeBackgroundProps {
  variant?: 'primary' | 'secondary' | 'subtle' | 'mixed'
  className?: string
  children?: React.ReactNode
}

export function DecorativeBackground({ 
  variant = 'subtle', 
  className,
  children 
}: DecorativeBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Circles */}
        {variant === 'primary' && (
          <>
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-20 right-1/4 w-64 h-64 rounded-full bg-secondary/5 blur-2xl" />
          </>
        )}
        
        {variant === 'secondary' && (
          <>
            <div className="absolute -top-32 right-1/3 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
            <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
            <div className="absolute top-1/3 -right-10 w-48 h-48 rounded-full bg-primary/5 blur-2xl" />
          </>
        )}
        
        {variant === 'subtle' && (
          <>
            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-secondary/3 blur-2xl" />
          </>
        )}
        
        {variant === 'mixed' && (
          <>
            <div className="absolute -top-20 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full bg-secondary/5 blur-3xl" />
            <div className="absolute -bottom-20 right-0 w-72 h-72 rounded-full bg-primary/5 blur-2xl" />
            
            {/* Geometric shapes */}
            <svg className="absolute top-20 left-10 w-16 h-16 text-primary/5" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="currentColor" />
            </svg>
            <svg className="absolute bottom-32 right-20 w-12 h-12 text-secondary/5" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="currentColor" />
            </svg>
            
            {/* X marks */}
            <svg className="absolute top-40 right-1/3 w-8 h-8 text-primary/10" viewBox="0 0 100 100">
              <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
            <svg className="absolute bottom-20 left-1/4 w-6 h-6 text-secondary/10" viewBox="0 0 100 100">
              <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
            
            {/* Lines */}
            <svg className="absolute top-1/3 left-1/2 w-32 h-1 text-primary/5" viewBox="0 0 100 4">
              <line x1="0" y1="2" x2="100" y2="2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <svg className="absolute bottom-1/3 right-1/4 w-24 h-1 text-secondary/5" viewBox="0 0 100 4">
              <line x1="0" y1="2" x2="100" y2="2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            
            {/* Dots pattern */}
            <div className="absolute top-1/4 right-10 grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/5" />
              ))}
            </div>
            <div className="absolute bottom-1/4 left-16 grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-secondary/5" />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
