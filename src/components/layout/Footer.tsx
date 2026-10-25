import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'
import logo from '@/assets/logo.png'

const footerLinks = {
  portal: [
    { name: 'Serviços', href: '/services' },
    { name: 'Para Solicitantes', href: '/for-requesters' },
    { name: 'Para Intérpretes', href: '/for-interpreters' },
    { name: 'Como Funciona', href: '/how-it-works' }
  ],
  institucional: [
    { name: 'Sobre Nós', href: '/impact' },
    { name: 'Impacto Social', href: '/impact' },
    { name: 'Contactos', href: '/contact' }
  ]
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container-wide py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/home" className="flex items-center gap-2 mb-4">
              <img
                src={logo}
                alt="Portal dos Intérpretes"
                className="h-14 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Conectamos pessoas e intérpretes de Língua Gestual Angolana para
              uma comunicação inclusiva.
            </p>
          </div>

          {/* Portal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Portal</h3>
            <ul className="space-y-3">
              {footerLinks.portal.map(link => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Institucional
            </h3>
            <ul className="space-y-3">
              {footerLinks.institucional.map(link => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contactos</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@gracemind.ao</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+244 923 456 789</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Luanda, Angola</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Portal dos Intérpretes. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground bg-accent px-3 py-1 rounded-full">
              Acessibilidade Primeiro
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
