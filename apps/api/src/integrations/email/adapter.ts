import nodemailer from 'nodemailer'

// The one door to email delivery (architecture.md §6): SMTP to the local Supabase mail server in
// development (Mailpit), to the provider in production — the same adapter, different variables.

export interface OutgoingEmail {
  to: string
  subject: string
  text: string
}

export interface EmailAdapter {
  send(email: OutgoingEmail): Promise<void>
}

export function createSmtpAdapter(options: {
  host: string
  port: number
  secure: boolean
  user?: string | undefined
  password?: string | undefined
  from: string
}): EmailAdapter {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    ...(options.user && options.password ? { auth: { user: options.user, pass: options.password } } : {}),
  })
  return {
    async send(email) {
      await transport.sendMail({ from: options.from, to: email.to, subject: email.subject, text: email.text })
    },
  }
}
