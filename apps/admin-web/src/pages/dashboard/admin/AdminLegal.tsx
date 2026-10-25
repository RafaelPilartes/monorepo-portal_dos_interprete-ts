import { useState } from 'react'
import { toast } from 'sonner'
import { COMMON_TEXTS, formatDateTime } from '@portal-dos-interpretes/i18n'
import { Badge } from '@portal-dos-interpretes/ui/components/badge'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { ConfirmationModal } from '@portal-dos-interpretes/ui/components/confirmation-modal'
import { PageHeader } from '@portal-dos-interpretes/ui/components/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@portal-dos-interpretes/ui/components/tabs'
import { Textarea } from '@portal-dos-interpretes/ui/components/textarea'
import { errorMessage } from '@/components/errorText'
import { QueryError, TableSkeleton } from '@/components/QueryStates'
import type { LegalDocumentRow } from '@/data/repositories'
import { useLegalDocuments, useLegalMutations } from '@/viewModels/staff-config.viewmodel'

// /settings/legal (staff-and-config.md): versions of the terms and of the privacy policy. A draft is
// written in Markdown, previewed and published; a published version is never edited (PC-05: the
// texts stay empty until the Academia provides them).

const KINDS = [
  { kind: 'terms', label: 'Termos de utilização' },
  { kind: 'privacy', label: 'Política de privacidade' },
] as const

function DraftEditor({ document }: { document: LegalDocumentRow }) {
  const { update, publish } = useLegalMutations()
  const [body, setBody] = useState(document.body)
  const [confirming, setConfirming] = useState(false)

  const save = async () => {
    try {
      await update.mutateAsync({ id: document.id, body })
      toast.success('Rascunho guardado.')
      return true
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    }
  }

  const doPublish = async () => {
    setConfirming(false)
    if (!(await save())) return
    try {
      await publish.mutateAsync(document.id)
      toast.success(`Versão ${document.version} publicada.`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-medium">Texto (Markdown)</p>
          <Textarea aria-label="Texto do documento" className="min-h-[320px] font-mono text-sm" value={body} onChange={(event) => setBody(event.target.value)} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Pré-visualização</p>
          <div className="min-h-[320px] whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
            {body.trim() === '' ? <span className="text-muted-foreground">Texto em preparação</span> : body}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => void save()} disabled={update.isPending}>{update.isPending ? COMMON_TEXTS.loading : 'Guardar rascunho'}</Button>
        <Button onClick={() => setConfirming(true)} disabled={publish.isPending}>Publicar…</Button>
      </div>
      <ConfirmationModal
        open={confirming}
        onOpenChange={setConfirming}
        title={`Publicar a versão ${document.version}?`}
        description="Todas as contas vão ter de aceitar esta versão no próximo acesso."
        onConfirm={() => void doPublish()}
      />
    </div>
  )
}

function KindPanel({ kind, documents }: { kind: 'terms' | 'privacy'; documents: LegalDocumentRow[] }) {
  const { create } = useLegalMutations()
  const versions = documents.filter((document) => document.kind === kind)
  const draft = versions.find((document) => document.published_at === null) ?? null
  const inForce = versions.find((document) => document.published_at !== null) ?? null

  const newDraft = async () => {
    try {
      await create.mutateAsync({ kind, body: inForce?.body ?? '' })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {inForce ? `Em vigor: versão ${inForce.version}` : 'Nenhuma versão em vigor'}
          </CardTitle>
          {!draft && <Button onClick={() => void newDraft()} disabled={create.isPending}>Nova versão</Button>}
        </CardHeader>
        <CardContent>
          {draft ? <DraftEditor key={draft.id} document={draft} /> : inForce && (
            <div className="whitespace-pre-wrap text-sm">{inForce.body.trim() === '' ? <span className="text-muted-foreground">Texto em preparação</span> : inForce.body}</div>
          )}
        </CardContent>
      </Card>
      <ul className="space-y-1 text-sm">
        {versions.map((document) => (
          <li key={document.id} className="flex items-center gap-2">
            <span>Versão {document.version}</span>
            <Badge variant={document.published_at ? 'default' : 'secondary'}>{document.published_at ? 'Publicada' : 'Rascunho'}</Badge>
            {document.published_at && <span className="text-muted-foreground">{formatDateTime(document.published_at)}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AdminLegal() {
  const documents = useLegalDocuments()
  return (
    <div className="space-y-6">
      <PageHeader title="Documentos legais" description="Termos de utilização e política de privacidade." />
      {documents.isPending ? (
        <TableSkeleton />
      ) : documents.isError ? (
        <QueryError error={documents.error} onRetry={() => void documents.refetch()} />
      ) : (
        <Tabs defaultValue="terms">
          <TabsList>
            {KINDS.map(({ kind, label }) => <TabsTrigger key={kind} value={kind}>{label}</TabsTrigger>)}
          </TabsList>
          {KINDS.map(({ kind }) => (
            <TabsContent key={kind} value={kind}>
              <KindPanel kind={kind} documents={documents.data} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
