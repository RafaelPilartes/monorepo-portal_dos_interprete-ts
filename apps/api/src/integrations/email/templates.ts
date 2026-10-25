// Email texts per notification kind (R-NOT-01: the list of kinds is specs/notifications.md; the
// email texts live with the API). Feature steps add each kind's own template as the feature lands;
// until then a kind uses the generic one, which points the person to the portal (AD-025).

export interface RenderedEmail {
  subject: string
  text: string
}

export type EmailPayload = Record<string, unknown>

type Template = (payload: EmailPayload) => RenderedEmail

const SIGNATURE = '\n\n—\nPortal dos Intérpretes · Academia Grace Mind'

const TEMPLATES: Partial<Record<string, Template>> = {}

// Same rule as the SQL domain util.relative_link: one leading slash, never "//host" or "/\\host".
const RELATIVE_LINK = /^\/([^/\\]|$)/

function linkLine(payload: EmailPayload, appUrl: string | undefined): string {
  const link = typeof payload.link === 'string' && RELATIVE_LINK.test(payload.link) ? payload.link : null
  if (!link || !appUrl) return ''
  const url = new URL(link, appUrl)
  return url.origin === new URL(appUrl).origin ? `\n\nAbre aqui: ${url.toString()}` : ''
}

export function renderEmail(kind: string, payload: EmailPayload, appUrl?: string): RenderedEmail {
  const template = TEMPLATES[kind]
  if (template) {
    const rendered = template(payload)
    return { subject: rendered.subject, text: rendered.text + linkLine(payload, appUrl) + SIGNATURE }
  }
  return {
    subject: 'Tens um novo aviso no Portal dos Intérpretes',
    text: `Olá,\n\nHá uma novidade na tua conta do Portal dos Intérpretes. Entra no portal para ver os detalhes.${linkLine(payload, appUrl)}${SIGNATURE}`,
  }
}
