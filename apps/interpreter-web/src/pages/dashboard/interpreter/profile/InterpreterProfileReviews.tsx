import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { Star } from 'lucide-react'
import { ProfileShell } from '@/components/profile/ProfileShell'

// /profile/reviews: the reviews received and revealed. They arrive with the reviews of the
// service lifecycle (R-DIR-05); until then the page says so instead of showing examples.
export default function InterpreterProfileReviews() {
  return (
    <ProfileShell title="Avaliações" description="O que os solicitantes dizem do teu trabalho.">
      {() => (
        <EmptyState
          icon={Star}
          title="Ainda sem avaliações"
          description="Depois de cada serviço, o solicitante pode avaliar-te. As avaliações aparecem aqui quando forem reveladas."
        />
      )}
    </ProfileShell>
  )
}
