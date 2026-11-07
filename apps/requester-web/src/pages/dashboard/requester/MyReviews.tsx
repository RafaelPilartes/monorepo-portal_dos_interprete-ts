import { ReviewsPage } from '@portal-dos-interpretes/features/requests/Reviews'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'

// requester-web /reviews (reviews.md "Ecrãs"): to review, given, received.
export default function MyReviews() {
  return (
    <div className="space-y-6">
      <PageHeader title="Avaliações" description="Avalia os intérpretes depois de cada serviço e vê o que disseram de ti." />
      <ReviewsPage role="requester" />
    </div>
  )
}
