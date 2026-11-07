export const FILE_PURPOSES = ['payment_proof', 'chat_attachment', 'ticket_attachment', 'verification_document'] as const
const PDF_JPG_PNG = ['application/pdf', 'image/jpeg', 'image/png'] as const
const PDF = ['application/pdf'] as const
const MB = 1024 * 1024

export const FILE_RULES = {
  payment_proof: { bucket: 'payment-proofs', types: PDF_JPG_PNG, maxBytes: 20 * MB },
  chat_attachment: { bucket: 'chat-attachments', types: PDF, maxBytes: 5 * MB },
  ticket_attachment: { bucket: 'support-attachments', types: PDF_JPG_PNG, maxBytes: 5 * MB },
  verification_document: {
    bucket: 'verification-docs', types: PDF, maxBytes: 50 * MB,
  },
}
