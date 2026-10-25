// Email texts per notification kind (R-NOT-01: the list of kinds is specs/notifications.md; the
// email texts live with the API). Feature steps add each kind's own template as the feature lands;
// until then a kind uses the generic one, which points the person to the portal (AD-025).

export interface RenderedEmail {
  subject: string
  text: string
}

export type EmailPayload = Record<string, unknown>

/** The four web apps (architecture.md §8). A notice's payload names its app in `app`. */
export interface AppUrls {
  site: string
  requester: string
  interpreter: string
  admin: string
}

type Template = (payload: EmailPayload) => RenderedEmail

const SIGNATURE = '\n\n—\nPortal dos Intérpretes · Academia Grace Mind'

const TEMPLATES: Partial<Record<string, Template>> = {}

// Same rule as the SQL domain util.relative_link: one leading slash, never "//host" or "/\\host".
const RELATIVE_LINK = /^\/([^/\\]|$)/

function linkLine(payload: EmailPayload, appUrls: AppUrls | undefined): string {
  const link = typeof payload.link === 'string' && RELATIVE_LINK.test(payload.link) ? payload.link : null
  const app = typeof payload.app === 'string' && appUrls && payload.app in appUrls ? (payload.app as keyof AppUrls) : null
  // Without the app the link belongs to, no link: a link to the wrong app is worse than none.
  const appUrl = app && appUrls ? appUrls[app] : undefined
  if (!link || !appUrl) return ''
  const url = new URL(link, appUrl)
  return url.origin === new URL(appUrl).origin ? `\n\nAbre aqui: ${url.toString()}` : ''
}

export function renderEmail(kind: string, payload: EmailPayload, appUrls?: AppUrls): RenderedEmail {
  const template = TEMPLATES[kind]
  if (template) {
    const rendered = template(payload)
    return { subject: rendered.subject, text: rendered.text + linkLine(payload, appUrls) + SIGNATURE }
  }
  return {
    subject: 'Tens um novo aviso no Portal dos Intérpretes',
    text: `Olá,\n\nHá uma novidade na tua conta do Portal dos Intérpretes. Entra no portal para ver os detalhes.${linkLine(payload, appUrls)}${SIGNATURE}`,
  }
}
