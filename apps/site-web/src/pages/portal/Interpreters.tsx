import { DirectoryList } from '@portal-dos-interpretes/features/directory/DirectoryList'
import { CheckCircle } from 'lucide-react'
import { PageBanner } from '@/components/PageBanner'
import { useHasDirectory } from '@/data/catalog'
import { interpreterProfileLoginUrl } from '@/lib/links'

// /interpreters (interpreter-profile-and-directory.md, site-web): the public listing, with search
// and filters paginated on the server. A card leads to the login, then back to the full profile
// in requester-web (D-05).
export default function Interpreters() {
  const hasDirectory = useHasDirectory()
  return (
    <div className="flex flex-col">
      <PageBanner
        title="Todos Intérpretes"
        subtitle="Encontre o intérprete ideal para as suas necessidades de comunicação."
      />
      <section className="border-b border-border bg-card">
        <div className="container-wide py-6">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>Para ver o perfil completo, os contactos e os preços, entre com a sua conta.</span>
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="container-wide">
          {hasDirectory ? <DirectoryList profileHref={interpreterProfileLoginUrl} /> : (
            <p role="alert" className="text-center text-muted-foreground">Não foi possível carregar os intérpretes neste momento. Tente outra vez dentro de momentos.</p>
          )}
        </div>
      </section>
    </div>
  )
}
