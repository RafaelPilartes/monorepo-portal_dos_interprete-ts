import { registerUrl, loginUrl } from '@/lib/links'
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@portal-dos-interpretes/ui/lib/utils'
import logo from '@portal-dos-interpretes/ui/assets/logo.png'

const navigation = [
  { name: 'Início', href: '/home' },
  { name: 'Intérpretes', href: '/interpreters' },
  { name: 'Serviços', href: '/services' },
  { name: 'Como Funciona', href: '/how-it-works' },
  { name: 'Impacto', href: '/impact' },
  { name: 'Contacto', href: '/contact' }
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    // Check initial scroll position
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/home') {
      return location.pathname === '/home' || location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  // Define if we should use the transparent style (only on Home before scrolling)
  const isHome = location.pathname === '/home' || location.pathname === '/'
  const isTransparent = isHome && !scrolled

  return (
    <header 
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        isTransparent 
          ? "bg-transparent border-t-0 border-b border-transparent py-2"
          : "bg-background/80 backdrop-blur-xl border-b border-border/20 supports-[backdrop-filter]:bg-background/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] py-0"
      )}
    >
      <nav className="container-wide flex h-20 items-center justify-between">
        {/* Logo */}
        <Link
          to="/home"
          className="flex items-center gap-3 transition-transform duration-300 hover:scale-105"
        >
          {/* Logo container with adaptive drop-shadow for dark backgrounds */}
          <div className={cn("transition-all duration-500", isTransparent && "drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]")}>
            <img src={logo} alt="Portal dos Intérpretes" className="h-12 w-auto" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navigation.map(item => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'relative py-2 text-[15px] font-medium transition-colors duration-300',
                isTransparent 
                  ? (isActive(item.href) ? 'text-white' : 'text-white/80 hover:text-white')
                  : (isActive(item.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')
              )}
            >
              {item.name}
              {/* Active Indicator Line */}
              {isActive(item.href) && (
                <span className={cn(
                  "absolute left-0 bottom-0 w-full h-0.5 rounded-t-full transition-all duration-300",
                  isTransparent ? "bg-white" : "bg-primary"
                )} />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <Button 
            variant="ghost" 
            className={cn(
              "text-[15px] font-medium transition-colors hover:bg-transparent",
              isTransparent ? "text-white hover:text-white/80" : "hover:text-primary"
            )} 
            asChild
          >
            <a href={loginUrl()}>Entrar</a>
          </Button>
          <Button 
            className={cn(
              "font-medium text-[15px] px-6 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 rounded-lg border",
              isTransparent 
                ? "bg-white text-slate-950 border-white/20 hover:bg-slate-100 shadow-white/10" 
                : "border-primary/20 shadow-primary/10"
            )} 
            asChild
          >
            <a href={registerUrl()}>Registar</a>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className={cn(
            "lg:hidden rounded-lg p-2 transition-colors",
            isTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-accent"
          )}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Abrir menu</span>
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/20 bg-background/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="container-wide py-6 space-y-3">
            {navigation.map(item => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block rounded-lg px-4 py-3 text-base font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary border border-primary/10'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-6 flex flex-col gap-3 border-t border-border/30 mt-4">
              <Button variant="outline" size="lg" className="w-full text-base" asChild>
                <a href={loginUrl()} onClick={() => setMobileMenuOpen(false)}>
                  Entrar
                </a>
              </Button>
              <Button size="lg" className="w-full text-base shadow-md shadow-primary/20" asChild>
                <a href={registerUrl()} onClick={() => setMobileMenuOpen(false)}>
                  Registar
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
