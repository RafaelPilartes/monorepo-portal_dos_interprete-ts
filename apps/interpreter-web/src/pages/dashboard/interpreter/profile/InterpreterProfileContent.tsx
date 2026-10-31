import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDirectory } from '@portal-dos-interpretes/features/directory/DirectoryContext'
import type { ArticleRow, MediaItemRow } from '@portal-dos-interpretes/features/directory/data'
import { formatDate } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@portal-dos-interpretes/ui/components/sheet'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { Field, ProfileShell } from '@/components/profile/ProfileShell'
import { failureOf, useProfileWrite } from '@/viewModels/profile.viewmodel'

// /profile/content (R-DIR-07): videos (YouTube or Vimeo links; the Portal hosts no video) and
// articles, published when saved. An item the team removed shows its reason and is never
// published again: the author writes a new one.

/** "Língua Gestual: o básico" → "lingua-gestual-o-basico-k3x9", unique per author. */
function articleSlug(title: string): string {
  const base = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '')
  return `${base || 'artigo'}-${Date.now().toString(36)}`
}

const tagsOf = (text: string): string[] => text.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10)

function Removed({ reason }: { reason: string | null }) {
  return <p className="text-sm text-destructive">Removido pela equipa: {reason}</p>
}

type VideoForm = { id: string | null; title: string; url: string; description: string; tags: string }

function Videos({ videos }: { videos: readonly MediaItemRow[] }) {
  const [editing, setEditing] = useState<VideoForm | null>(null)
  const save = useProfileWrite((repository, accountId, input: VideoForm) => {
    const values = { title: input.title.trim(), url: input.url.trim(), description: input.description.trim() || null, tags: tagsOf(input.tags) }
    return input.id ? repository.updateOwn('media_items', input.id, values) : repository.insertOwn('media_items', { interpreter_id: accountId, kind: 'video', ...values })
  }, 'Vídeo publicado.')
  const remove = useProfileWrite((repository, _accountId, id: string) => repository.deleteOwn('media_items', id), 'Vídeo apagado.')
  const errors = save.isError ? failureOf(save.error).fields : {}
  const set = (key: keyof VideoForm, value: string) => setEditing((current) => current && { ...current, [key]: value })

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Vídeos</CardTitle>
          <CardDescription>Links do YouTube ou do Vimeo. Ficam publicados ao gravar.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => { save.reset(); setEditing({ id: null, title: '', url: '', description: '', tags: '' }) }}>
          <Plus className="h-4 w-4" />Acrescentar vídeo
        </Button>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não acrescentaste vídeos.</p> : (
          <ul className="divide-y">
            {videos.map((row) => (
              <li key={row.id} className="flex items-start gap-3 py-3">
                <div className="flex-1 space-y-1 text-sm">
                  <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium hover:underline">{row.title}<ExternalLink className="h-3 w-3" /></a>
                  {row.status === 'removed' ? <Removed reason={row.removed_reason} /> : row.tags.length > 0 && <div className="flex flex-wrap gap-1">{row.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>}
                </div>
                {row.status === 'published' && (
                  <>
                    <Button variant="ghost" size="icon" aria-label={`Editar ${row.title}`} onClick={() => { save.reset(); setEditing({ id: row.id, title: row.title, url: row.url, description: row.description ?? '', tags: row.tags.join(', ') }) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Apagar ${row.title}`} disabled={remove.isPending} onClick={() => remove.mutate(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing?.id ? 'Editar vídeo' : 'Acrescentar vídeo'}</SheetTitle>
            <SheetDescription>Fica visível no teu perfil logo que gravares.</SheetDescription>
          </SheetHeader>
          {editing && (
            <form className="flex flex-1 flex-col" onSubmit={(event) => { event.preventDefault(); save.mutate(editing, { onSuccess: () => setEditing(null) }) }}>
              <div className="flex-1 space-y-4 overflow-y-auto px-1 py-4">
                <Field id="video-title" label="Título" error={errors.title}><Input id="video-title" value={editing.title} onChange={(e) => set('title', e.target.value)} /></Field>
                <Field id="video-url" label="Link" hint="Por exemplo https://www.youtube.com/watch?v=…" error={errors.url}><Input id="video-url" type="url" value={editing.url} onChange={(e) => set('url', e.target.value)} /></Field>
                <Field id="video-description" label="Descrição" error={errors.description}><Textarea id="video-description" rows={3} value={editing.description} onChange={(e) => set('description', e.target.value)} /></Field>
                <Field id="video-tags" label="Etiquetas" hint="Separadas por vírgulas, até 10." error={errors.tags}><Input id="video-tags" value={editing.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
                {save.isError && Object.keys(errors).length === 0 && <p role="alert" className="text-sm text-destructive">{failureOf(save.error).message}</p>}
              </div>
              <SheetFooter className="gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={save.isPending}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending}>{save.isPending ? 'A publicar…' : 'Publicar'}</Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  )
}

type ArticleForm = { id: string | null; title: string; summary: string; body: string; tags: string; cover: File | null; coverPath: string | null }

function Articles({ articles, slug }: { articles: readonly ArticleRow[]; slug: string }) {
  const { repository } = useDirectory()
  const [editing, setEditing] = useState<ArticleForm | null>(null)
  const save = useProfileWrite(async (repo, accountId, input: ArticleForm) => {
    const cover_path = input.cover ? await repo.uploadCover(accountId, input.cover) : input.coverPath
    const values = { title: input.title.trim(), summary: input.summary.trim() || null, body: input.body, tags: tagsOf(input.tags), cover_path }
    return input.id ? repo.updateOwn('articles', input.id, values) : repo.insertOwn('articles', { interpreter_id: accountId, slug: articleSlug(input.title), ...values })
  }, 'Artigo publicado.')
  const remove = useProfileWrite((repo, _accountId, id: string) => repo.deleteOwn('articles', id), 'Artigo apagado.')
  const errors = save.isError ? failureOf(save.error).fields : {}
  const set = <K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) => setEditing((current) => current && { ...current, [key]: value })

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Artigos</CardTitle>
          <CardDescription>Textos teus, publicados ao gravar.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => { save.reset(); setEditing({ id: null, title: '', summary: '', body: '', tags: '', cover: null, coverPath: null }) }}>
          <Plus className="h-4 w-4" />Escrever artigo
        </Button>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não escreveste artigos.</p> : (
          <ul className="divide-y">
            {articles.map((row) => (
              <li key={row.id} className="flex items-start gap-3 py-3">
                <div className="flex-1 space-y-1 text-sm">
                  {row.status === 'published'
                    ? <Link to={`/interpreters/${slug}/articles/${row.slug}`} className="font-medium hover:underline">{row.title}</Link>
                    : <p className="font-medium">{row.title}</p>}
                  <p className="text-muted-foreground">{formatDate(row.published_at)}</p>
                  {row.status === 'removed' && <Removed reason={row.removed_reason} />}
                </div>
                {row.status === 'published' && (
                  <>
                    <Button variant="ghost" size="icon" aria-label={`Editar ${row.title}`} onClick={() => { save.reset(); setEditing({ id: row.id, title: row.title, summary: row.summary ?? '', body: row.body, tags: row.tags.join(', '), cover: null, coverPath: row.cover_path }) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Apagar ${row.title}`} disabled={remove.isPending} onClick={() => remove.mutate(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editing?.id ? 'Editar artigo' : 'Escrever artigo'}</SheetTitle>
            <SheetDescription>Fica visível no teu perfil logo que gravares. Separa os parágrafos com uma linha em branco.</SheetDescription>
          </SheetHeader>
          {editing && (
            <form className="flex flex-1 flex-col" onSubmit={(event) => { event.preventDefault(); save.mutate(editing, { onSuccess: () => setEditing(null) }) }}>
              <div className="flex-1 space-y-4 overflow-y-auto px-1 py-4">
                <Field id="article-title" label="Título" error={errors.title}><Input id="article-title" value={editing.title} onChange={(e) => set('title', e.target.value)} /></Field>
                <Field id="article-summary" label="Resumo" error={errors.summary}><Textarea id="article-summary" rows={2} value={editing.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
                <Field id="article-body" label="Texto" error={errors.body}><Textarea id="article-body" rows={12} value={editing.body} onChange={(e) => set('body', e.target.value)} /></Field>
                <Field id="article-tags" label="Etiquetas" hint="Separadas por vírgulas, até 10." error={errors.tags}><Input id="article-tags" value={editing.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
                <Field id="article-cover" label="Capa" hint="JPG, PNG ou WebP, até 5 MB.">
                  {editing.coverPath && !editing.cover && <img src={repository.publicUrl('interpreter-media', editing.coverPath) ?? ''} alt="" className="mb-2 aspect-video w-full rounded-md object-cover" />}
                  <Input id="article-cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => set('cover', e.target.files?.[0] ?? null)} />
                </Field>
                {save.isError && Object.keys(errors).length === 0 && <p role="alert" className="text-sm text-destructive">{failureOf(save.error).message}</p>}
              </div>
              <SheetFooter className="gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={save.isPending}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending}>{save.isPending ? 'A publicar…' : 'Publicar'}</Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  )
}

export default function InterpreterProfileContent() {
  return (
    <ProfileShell title="Conteúdo" description="Vídeos e artigos que mostram o teu trabalho.">
      {({ details }) => (
        <div className="space-y-6">
          <Videos videos={details.videos} />
          <Articles articles={details.articles} slug={details.profile.slug} />
        </div>
      )}
    </ProfileShell>
  )
}
