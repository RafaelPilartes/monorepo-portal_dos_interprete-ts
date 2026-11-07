import { Link, useParams } from 'react-router-dom'
import { formatDate } from '@portal-dos-interpretes/i18n'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { ArrowLeft } from 'lucide-react'
import { QueryError } from '../components/QueryStates'
import { useDirectory, useInterpreterDetails } from '../directory/DirectoryContext'
import { InterpreterNotFound, ProfileSkeleton } from './InterpreterProfile'

// /interpreters/:slug/articles (R-DIR-07): the published articles, newest first.
export default function InterpreterArticles() {
  const { slug = '' } = useParams()
  const { repository } = useDirectory()
  const details = useInterpreterDetails(slug)
  if (details.isPending) return <ProfileSkeleton />
  if (details.isError) return <QueryError error={details.error} onRetry={() => void details.refetch()} />
  if (!details.data) return <InterpreterNotFound />
  const articles = details.data.articles.filter((row) => row.status === 'published')
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to={`/interpreters/${slug}`}><ArrowLeft className="h-4 w-4" />{details.data.fullName}</Link></Button>
      <h1 className="text-2xl font-semibold">Artigos</h1>
      {articles.length === 0 ? (
        <p className="text-muted-foreground">Ainda não há artigos.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((row) => {
            const cover = repository.publicUrl('interpreter-media', row.cover_path)
            return (
              <Card key={row.id} className="overflow-hidden">
                {cover && <img src={cover} alt="" className="aspect-video w-full object-cover" />}
                <CardContent className="space-y-2 pt-6">
                  <p className="text-xs text-muted-foreground">{formatDate(row.published_at)}</p>
                  <h2 className="font-semibold"><Link to={row.slug} className="hover:underline">{row.title}</Link></h2>
                  {row.summary && <p className="text-sm text-muted-foreground">{row.summary}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
