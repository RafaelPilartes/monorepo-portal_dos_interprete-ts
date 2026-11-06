import { ReceivedReviews } from '@portal-dos-interpretes/features/requests/Reviews'
import { useRequests } from '@portal-dos-interpretes/features/requests/RequestsContext'
import { ProfileShell } from '@/components/profile/ProfileShell'

// /profile/reviews: the reviews received and revealed, as the profile shows them (R-REV-03, R-DIR-05).
export default function InterpreterProfileReviews() {
  const { accountId } = useRequests()
  return (
    <ProfileShell title="Avaliações" description="O que os solicitantes dizem do teu trabalho.">
      {() => <ReceivedReviews accountId={accountId} role="interpreter" title="Avaliações recebidas" />}
    </ProfileShell>
  )
}
