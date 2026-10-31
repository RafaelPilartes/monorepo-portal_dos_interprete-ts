import { Link } from 'react-router-dom'
import { InterpreterCard } from '@portal-dos-interpretes/features/components/InterpreterCard'
import { QueryError } from '@portal-dos-interpretes/features/components/QueryStates'
import { toCard, useDirectory, useFavorites, useFavoriteToggle } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { EmptyState } from '@portal-dos-interpretes/ui/components/empty-state'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Skeleton } from '@portal-dos-interpretes/ui/components/skeleton'
import { Heart } from 'lucide-react'

// /favorites (R-DIR-10): the requester's own marks, with "Remover". An interpreter who left the
// directory (incomplete profile, suspended account) stops showing here.
export default function FavoriteInterpreters() {
  const { repository } = useDirectory()
  const favorites = useFavorites()
  const toggle = useFavoriteToggle()

  return (
    <>
      <PageHeader title="Favoritos" description="Os intérpretes que marcaste para encontrar depressa." />
      {favorites.isPending ? (
        <div role="status" aria-label="A carregar os favoritos" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="h-96 rounded-2xl" />)}
        </div>
      ) : favorites.isError ? (
        <QueryError error={favorites.error} onRetry={() => void favorites.refetch()} />
      ) : favorites.data.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Ainda não tens favoritos."
          description="No directório, carrega no coração de um intérprete para o guardar aqui."
          action={<Button asChild><Link to="/interpreters">Ver intérpretes</Link></Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.data.map((row) => (
            <div key={row.account_id} className="space-y-2">
              <InterpreterCard interpreter={toCard(row, repository)} />
              {toggle && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={toggle.toggle.isPending}
                  onClick={() => toggle.toggle.mutate({ interpreterId: row.account_id ?? '', favorite: false })}
                >
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
