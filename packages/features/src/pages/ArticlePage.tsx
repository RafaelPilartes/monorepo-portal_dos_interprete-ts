import { Link, useParams } from 'react-router-dom'
import { formatDate } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { ArrowLeft } from 'lucide-react'
import { QueryError } from '../components/QueryStates'
import { useDirectory, useInterpreterDetails } from '../directory/DirectoryContext'
import { InterpreterNotFound, ProfileSkeleton } from './InterpreterProfile'

// /interpreters/:slug/articles/:articleSlug (R-DIR-07): the text as written (plain paragraphs).
export default function ArticlePage() {
  const { slug = '', articleSlug = '' } = useParams()
  const { repository } = useDirectory()
  const details = useInterpreterDetails(slug)
  if (details.isPending) return <ProfileSkeleton />
  if (details.isError) return <QueryError error={details.error} onRetry={() => void details.refetch()} />
  const article = details.data?.articles.find((row) => row.slug === articleSlug && row.status === 'published')
  if (!details.data) return <InterpreterNotFound />
  if (!article) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Este artigo não existe ou já não está disponível.</h1>
        <Button variant="outline" asChild><Link to={`/interpreters/${slug}`}>Ver o perfil de {details.data.fullName}</Link></Button>
      </div>
    )
  }
  const cover = repository.publicUrl('interpreter-media', article.cover_path)
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to={`/interpreters/${slug}/articles`}><ArrowLeft className="h-4 w-4" />Artigos de {details.data.fullName}</Link></Button>
      {cover && <img src={cover} alt="" className="aspect-video w-full rounded-xl object-cover" />}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{article.title}</h1>
        <p className="text-sm text-muted-foreground">{details.data.fullName} · {formatDate(article.published_at)}</p>
        {article.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{article.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>}
      </header>
      {article.summary && <p className="text-lg text-muted-foreground">{article.summary}</p>}
      <div className="space-y-4 leading-relaxed">
        {article.body.split(/\n{2,}/).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
      </div>
    </article>
  )
}
