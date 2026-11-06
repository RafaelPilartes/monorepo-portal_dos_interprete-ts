// The receipt as a PDF (R-PAY-12), written by hand: one A4 page of text in Helvetica, with the
// payload the database stored when the receipt was issued. No library: the document is a few lines
// of text, and adding a dependency was not needed for it (AD-039).

export interface ReceiptPayload {
  number: string
  kind: 'payment' | 'refund'
  issued_at: string
  issued_to: string
  description: string
  payment_reference: string
  amount_aoa: number
  base_aoa?: number | null
  tax_aoa?: number | null
  refund_reference?: string | null
  issuer?: string | null
  notice: string
}

const aoa = (value: number) => `${new Intl.NumberFormat('pt-PT', { useGrouping: true }).format(value).replace(/\u00a0|\u202f/g, ' ')} Kz`
const date = (value: string) =>
  new Intl.DateTimeFormat('pt-PT', { timeZone: 'Africa/Luanda', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))

/** The lines of the receipt, in Portuguese (what the person reads). */
export function receiptLines(payload: ReceiptPayload): string[] {
  const lines = [
    payload.kind === 'refund' ? 'Recibo de reembolso' : 'Recibo de pagamento',
    `N.º ${payload.number}`,
    `Emitido a ${date(payload.issued_at)} (hora de Luanda)`,
    '',
    `Emitido por: ${payload.issuer ?? 'Academia Grace Mind'}`,
    `Emitido a: ${payload.issued_to}`,
    `Referente a: ${payload.description}`,
    `Referência do pagamento: ${payload.payment_reference}`,
  ]
  if (payload.kind === 'refund') {
    lines.push(`Valor reembolsado: ${aoa(payload.amount_aoa)}`)
    if (payload.refund_reference) lines.push(`Referência da transferência: ${payload.refund_reference}`)
  } else {
    if (payload.base_aoa !== null && payload.base_aoa !== undefined) lines.push(`Valor base: ${aoa(payload.base_aoa)}`)
    if (payload.tax_aoa !== null && payload.tax_aoa !== undefined) lines.push(`Imposto: ${aoa(payload.tax_aoa)}`)
    lines.push(`Total pago: ${aoa(payload.amount_aoa)}`)
  }
  lines.push('', payload.notice)
  return lines
}

/** Characters WinAnsi has outside Latin-1, at their WinAnsi byte (names and descriptions use them). */
const WIN_ANSI: Readonly<Record<string, number>> = {
  '\u20ac': 0x80, '\u201a': 0x82, '\u201e': 0x84, '\u2026': 0x85, '\u2018': 0x91, '\u2019': 0x92, '\u201c': 0x93,
  '\u201d': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97, '\u0152': 0x8c, '\u0153': 0x9c,
}

/** PDF string literal in WinAnsi, with ( ) \ escaped; what WinAnsi cannot show becomes "?". */
function pdfText(text: string): Buffer {
  const parts: number[] = []
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0x3f
    const byte = WIN_ANSI[char] ?? (code >= 0x20 && code <= 0xff && (code < 0x7f || code >= 0xa0) ? code : 0x3f)
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) parts.push(0x5c)
    parts.push(byte)
  }
  return Buffer.from(parts)
}

/** Lines of at most `width` characters, broken at spaces (an A4 page holds about 85 at 11 pt). */
export function wrap(line: string, width = 85): string[] {
  if (line.length <= width) return [line]
  const out: string[] = []
  let current = ''
  for (const word of line.split(' ')) {
    if (current && (current + ' ' + word).length > width) {
      out.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
    while (current.length > width) {
      out.push(current.slice(0, width))
      current = current.slice(width)
    }
  }
  if (current) out.push(current)
  return out
}

export function receiptPdf(payload: ReceiptPayload): Buffer {
  const lines = receiptLines(payload).flatMap((line, index) => (index === 0 ? [line] : wrap(line)))
  const content: Buffer[] = [Buffer.from('BT\n/F1 11 Tf\n56 780 Td\n16 TL\n', 'latin1')]
  lines.forEach((line, index) => {
    const size = index === 0 ? 16 : 11
    content.push(Buffer.from(`/F1 ${size} Tf\n(`, 'latin1'), pdfText(line), Buffer.from(') Tj T*\n', 'latin1'))
  })
  content.push(Buffer.from('ET\n', 'latin1'))
  const stream = Buffer.concat(content)
  const objects: Buffer[] = [
    Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'latin1'),
    Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>', 'latin1'),
    Buffer.from('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', 'latin1'),
    Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', 'latin1'),
    Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, 'latin1'), stream, Buffer.from('endstream', 'latin1')]),
  ]
  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'latin1')]
  const offsets: number[] = []
  let length = chunks[0]!.length
  objects.forEach((object, index) => {
    offsets.push(length)
    const chunk = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`, 'latin1'), object, Buffer.from('\nendobj\n', 'latin1')])
    chunks.push(chunk)
    length += chunk.length
  })
  const xref = [`xref\n0 ${objects.length + 1}\n`, '0000000000 65535 f \n', ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)].join('')
  chunks.push(Buffer.from(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`, 'latin1'))
  return Buffer.concat(chunks)
}
