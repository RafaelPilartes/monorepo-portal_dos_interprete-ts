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

const text = (value: unknown): string => (typeof value === 'string' ? value : '')
const ROLE_NAMES: Record<string, string> = { admin: 'administrador', member: 'membro' }
const DOCUMENT_NAMES: Record<string, string> = { terms: 'dos Termos e Condições', privacy: 'da Política de Privacidade' }

const TEMPLATES: Partial<Record<string, Template>> = {
  // R-ORG-02: the link carries the invite token (payload.link, requester-web /invite/:token).
  org_invite: (payload) => ({
    subject: `Convite para ${text(payload.organization_name)} no Portal dos Intérpretes`,
    text: `Olá,\n\n${text(payload.invited_by_name) || 'Um responsável'} convidou-te para fazeres parte de ${text(payload.organization_name)} no Portal dos Intérpretes, como ${ROLE_NAMES[text(payload.role)] ?? 'membro'}.\n\nPara aceitar, abre o link abaixo e entra (ou cria a conta) com este email. O convite expira dentro de alguns dias.`,
  }),
  // R-ACC-05
  account_suspended: (payload) => ({
    subject: 'A tua conta no Portal dos Intérpretes foi suspensa',
    text: `Olá,\n\nA tua conta no Portal dos Intérpretes foi suspensa pela equipa da plataforma.${text(payload.reason) ? `\n\nMotivo: ${text(payload.reason)}` : ''}\n\nSe achas que é um engano, responde a este email ou contacta o suporte da Academia Grace Mind.`,
  }),
  // R-DIR-07
  content_removed: (payload) => ({
    subject: 'A equipa removeu um conteúdo teu do Portal dos Intérpretes',
    text: `Olá,\n\nA equipa da plataforma removeu ${text(payload.kind) === 'article' ? 'o teu artigo' : 'o teu vídeo'}${text(payload.title) ? ` «${text(payload.title)}»` : ''}.${text(payload.reason) ? `\n\nMotivo: ${text(payload.reason)}` : ''}\n\nO conteúdo deixou de estar visível para os outros. Se quiseres, podes publicar um novo.`,
  }),
  // R-PRIV-02
  terms_updated: (payload) => ({
    subject: 'Actualizámos os documentos legais do Portal dos Intérpretes',
    text: `Olá,\n\nPublicámos uma nova versão ${DOCUMENT_NAMES[text(payload.kind)] ?? 'dos documentos legais'}. Da próxima vez que entrares no portal, vais ver o texto novo e aceitá-lo para continuar.`,
  }),
}

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
