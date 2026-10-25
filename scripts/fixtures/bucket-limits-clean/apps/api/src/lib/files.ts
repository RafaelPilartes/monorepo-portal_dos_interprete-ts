const PDF_JPG_PNG = ['application/pdf', 'image/jpeg', 'image/png'] as const
const MB = 1024 * 1024

export const FILE_RULES = {
  payment_proof: { bucket: 'payment-proofs', types: PDF_JPG_PNG, maxBytes: 10 * MB },
  chat_attachment: { bucket: 'chat-attachments', types: PDF_JPG_PNG, maxBytes: 5 * MB },
}
