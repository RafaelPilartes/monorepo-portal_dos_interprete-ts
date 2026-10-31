// Private file purposes (api.md §6): the bucket, the accepted types and the size limit of each.
// The same limits are in supabase/config.toml; the API refuses first so the person gets the
// catalog message instead of a storage error.

export const FILE_PURPOSES = ['payment_proof', 'verification_document', 'chat_attachment', 'ticket_attachment'] as const
export type FilePurpose = (typeof FILE_PURPOSES)[number]

const PDF_JPG_PNG = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const MB = 1024 * 1024

export const FILE_RULES: Readonly<Record<FilePurpose, { bucket: string; types: readonly string[]; maxBytes: number }>> = {
  payment_proof: { bucket: 'payment-proofs', types: PDF_JPG_PNG, maxBytes: 10 * MB },
  verification_document: { bucket: 'verification-docs', types: PDF_JPG_PNG, maxBytes: 10 * MB },
  chat_attachment: { bucket: 'chat-attachments', types: PDF_JPG_PNG, maxBytes: 5 * MB },
  ticket_attachment: { bucket: 'support-attachments', types: PDF_JPG_PNG, maxBytes: 5 * MB },
}

/** Reasons shown inside FILE_INVALID ("Ficheiro inválido: {reason}."), in Portuguese. */
export const FILE_INVALID_REASONS = {
  type: 'tem de ser PDF, JPG ou PNG',
  size: (megabytes: number) => `tem de ter até ${megabytes} MB`,
  name: 'o nome do ficheiro não é válido',
} as const

/** A storage-safe file name: letters, digits, dot, dash and underscore; at most 100 characters. */
export function safeFileName(name: string): string | null {
  const base = name.split(/[\\/]/).pop() ?? ''
  const cleaned = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[-.]+/, '')
    .slice(-100)
  return cleaned.length > 0 ? cleaned : null
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const PATH = new RegExp(`^(${FILE_PURPOSES.join('|')})/(${UUID})/(${UUID})-([A-Za-z0-9._-]{1,100})$`)

/** Reads a path the API issued: <purpose>/<subject_id>/<uuid>-<name>. Anything else is null. */
export function parseFilePath(path: string): { purpose: FilePurpose; subjectId: string } | null {
  const match = PATH.exec(path)
  if (!match) return null
  return { purpose: match[1] as FilePurpose, subjectId: match[2] as string }
}
