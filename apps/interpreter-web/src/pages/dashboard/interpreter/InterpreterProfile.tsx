import { Link } from 'react-router-dom'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { Briefcase, CheckCircle2, ChevronRight, CircleAlert, Eye, FileText, GraduationCap, Phone, Star, User } from 'lucide-react'
import { ProfileShell } from '@/components/profile/ProfileShell'

// /profile (interpreter-profile-and-directory.md): whether the profile shows in the directory and,
// if not, what is missing, read from directory.my_profile_status (R-DIR-01), with a link to each
// section.

const MISSING: Readonly<Record<string, { text: (bioMin: number) => string; href: string } | { text: string; href: string }>> = {
  bio: { text: (bioMin: number) => `uma biografia com pelo menos ${bioMin} caracteres`, href: '/profile/overview' },
  modality: { text: 'a modalidade (presencial, online ou as duas)', href: '/profile/overview' },
  city: { text: 'a cidade, porque trabalhas presencialmente', href: '/profile/overview' },
  languages: { text: 'pelo menos uma língua', href: '/profile/services' },
  services: { text: 'pelo menos um serviço activo com preço', href: '/profile/services' },
}

const SECTIONS = [
  { href: '/profile/overview', icon: User, title: 'Visão geral', text: 'Fotografia, biografia, modalidade, cidade e tarifas.' },
  { href: '/profile/services', icon: Briefcase, title: 'Línguas e serviços', text: 'Línguas com nível, especialidades e os teus preços.' },
  { href: '/profile/experience', icon: GraduationCap, title: 'Percurso', text: 'Formação, experiência e certificações.' },
  { href: '/profile/content', icon: FileText, title: 'Conteúdo', text: 'Vídeos e artigos.' },
  { href: '/profile/contact', icon: Phone, title: 'Contactos', text: 'Telefone, WhatsApp, site e redes.' },
  { href: '/profile/reviews', icon: Star, title: 'Avaliações', text: 'O que dizem de ti.' },
]

export default function InterpreterProfile() {
  return (
    <ProfileShell title="O meu perfil" description="O que os solicitantes e os colegas veem de ti no directório." back={false}>
      {({ details, missing, complete, bioMinLength }) => (
        <>
          <Card className={complete ? 'border-success/40' : 'border-warning/50'}>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                {complete
                  ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                  : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />}
                <div className="space-y-2">
                  <p className="font-medium">{complete ? 'Visível no directório' : 'Ainda não visível no directório'}</p>
                  {complete ? (
                    <p className="text-sm text-muted-foreground">Quem procura intérpretes encontra-te e pode ver o teu perfil completo.</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Falta:</p>
                      <ul className="space-y-1 text-sm">
                        {missing.map((key) => {
                          const item = MISSING[key]
                          return item ? <li key={key}><Link to={item.href} className="text-primary hover:underline">{typeof item.text === 'function' ? item.text(bioMinLength) : item.text}</Link></li> : null
                        })}
                      </ul>
                    </>
                  )}
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to={`/interpreters/${details.profile.slug}`}><Eye className="h-4 w-4" />Ver como os outros me veem</Link>
              </Button>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map(({ href, icon: Icon, title, text }) => (
              <Link key={href} to={href} className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
                <Icon className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </>
      )}
    </ProfileShell>
  )
}
