import { useEffect, useState } from 'react'
import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@portal-dos-interpretes/ui/components/dialog'
import { ReadOnlyDAO } from '@portal-dos-interpretes/data'
import { useRequiredPortalServices } from '../services/PortalServices'

export interface LegalDocument {
  id: string
  kind: 'terms' | 'privacy'
  version: number
  body: string
}

type LegalState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; documents: LegalDocument[] }

/** The versions in force of the terms and the privacy policy (R-PRIV-01): the latest published of each kind. */
export function useLegalDocumentsInForce(): LegalState {
  const services = useRequiredPortalServices()
  const [state, setState] = useState<LegalState>({ status: 'loading' })
  useEffect(() => {
    let active = true
    const dao = new ReadOnlyDAO<LegalDocument & { published_at: string | null }>(services.client, 'identity', 'legal_documents')
    dao.list({ orderBy: 'version', ascending: false })
      .then(({ data }) => {
        const latest = new Map<string, LegalDocument>()
        for (const row of data) if (row.published_at && !latest.has(row.kind)) latest.set(row.kind, row)
        if (active) setState({ status: 'ready', documents: [...latest.values()] })
      })
      .catch((error: unknown) => {
        console.error('[auth] legal documents could not be read', error)
        if (active) setState({ status: 'error' })
      })
    return () => {
      active = false
    }
  }, [services])
  return state
}

const TITLES = { terms: AUTH_TEXTS.termsLink, privacy: AUTH_TEXTS.privacyLink }

/** Opens a document in force; an empty text says so (PC-05). */
export function LegalDocumentDialog({ document, onClose }: { document: LegalDocument | null; onClose: () => void }) {
  return (
    <Dialog open={document !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{document ? `${TITLES[document.kind]} · versão ${document.version}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {document?.body.trim() ? document.body : <p className="text-muted-foreground">{AUTH_TEXTS.legalPending}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
