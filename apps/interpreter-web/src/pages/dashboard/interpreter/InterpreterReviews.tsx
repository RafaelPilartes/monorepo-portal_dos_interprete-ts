import { ReviewsPage } from '@portal-dos-interpretes/features/requests/Reviews'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'

// interpreter-web /reviews (reviews.md "Ecrãs"): to review, given, received.
export default function InterpreterReviews() {
  return (
    <div className="space-y-6">
      <PageHeader title="Avaliações" description="Avalia os solicitantes depois de cada serviço e vê o que disseram do teu trabalho." />
      <ReviewsPage role="interpreter" />
    </div>
  )
}
