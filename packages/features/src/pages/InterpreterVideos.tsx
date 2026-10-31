import { Link, useParams } from 'react-router-dom'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent } from '@portal-dos-interpretes/ui/components/card'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { QueryError } from '../components/QueryStates'
import { useInterpreterDetails } from '../directory/DirectoryContext'
import { videoEmbedUrl } from '../directory/labels'
import { InterpreterNotFound, ProfileSkeleton } from './InterpreterProfile'

// /interpreters/:slug/videos (R-DIR-07): links to YouTube or Vimeo, embedded; any other link
// stays a plain link. The Portal hosts no video.
export default function InterpreterVideos() {
  const { slug = '' } = useParams()
  const details = useInterpreterDetails(slug)
  if (details.isPending) return <ProfileSkeleton />
  if (details.isError) return <QueryError error={details.error} onRetry={() => void details.refetch()} />
  if (!details.data) return <InterpreterNotFound />
  const videos = details.data.videos.filter((row) => row.status === 'published')
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to={`/interpreters/${slug}`}><ArrowLeft className="h-4 w-4" />{details.data.fullName}</Link></Button>
      <h1 className="text-2xl font-semibold">Vídeos</h1>
      {videos.length === 0 ? (
        <p className="text-muted-foreground">Ainda não há vídeos.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {videos.map((row) => {
            const embed = videoEmbedUrl(row.url)
            return (
              <Card key={row.id}>
                <CardContent className="space-y-3 pt-6">
                  {embed && (
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                      <iframe src={embed} title={row.title} loading="lazy" allowFullScreen className="absolute inset-0 h-full w-full" />
                    </div>
                  )}
                  <h2 className="font-semibold">{row.title}</h2>
                  {row.description && <p className="text-sm text-muted-foreground">{row.description}</p>}
                  {!embed && <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Abrir o vídeo<ExternalLink className="h-3 w-3" /></a>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
