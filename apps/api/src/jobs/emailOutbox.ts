import type { FastifyBaseLogger } from 'fastify'
import type { Database } from '../lib/db.js'
import type { EmailAdapter } from '../integrations/email/adapter.js'
import { renderEmail, type EmailPayload } from '../integrations/email/templates.js'

// Email worker (api.md §15, R-NOT-03). SQL owns the state machine: notify.claim_emails reserves up
// to 20 due rows with FOR UPDATE SKIP LOCKED (two workers never take the same row);
// notify.mark_email_sent / notify.mark_email_failed record the outcome, with retries at 1, 5 and
// 30 minutes and `failed` at the fourth failure. The worker only renders and sends.

export const EMAIL_BATCH = 20
export const EMAIL_INTERVAL_MS = 30_000

interface ClaimedEmail {
  id: string
  to_email: string
  template: string
  payload: EmailPayload
}

export interface EmailRunResult {
  sent: number
  failed: number
}

export async function runEmailBatch(deps: {
  db: Database
  adapter: EmailAdapter
  log: FastifyBaseLogger
  appUrl?: string | undefined
}): Promise<EmailRunResult> {
  const claimed = await deps.db.transaction(async (client) => {
    const result = await client.query<ClaimedEmail>(
      'SELECT id, to_email, template, payload FROM notify.claim_emails($1)',
      [EMAIL_BATCH],
    )
    return result.rows
  })
  const outcome: EmailRunResult = { sent: 0, failed: 0 }
  for (const email of claimed) {
    try {
      const rendered = renderEmail(email.template, email.payload, deps.appUrl)
      await deps.adapter.send({ to: email.to_email, ...rendered })
      await deps.db.transaction((client) => client.query('SELECT notify.mark_email_sent($1)', [email.id]))
      outcome.sent += 1
    } catch (error) {
      outcome.failed += 1
      deps.log.warn({ err: error, emailId: email.id }, 'email delivery failed')
      await deps.db
        .transaction((client) => client.query('SELECT notify.mark_email_failed($1, $2)', [email.id, String(error).slice(0, 500)]))
        .catch((markError: unknown) => deps.log.error({ err: markError, emailId: email.id }, 'could not record email failure'))
    }
  }
  return outcome
}

/** Starts the 30-second loop; returns a function that stops it and waits for the running batch. */
export function startEmailWorker(deps: Parameters<typeof runEmailBatch>[0]): () => Promise<void> {
  let running: Promise<unknown> = Promise.resolve()
  let stopped = false
  const tick = () => {
    if (stopped) return
    running = runEmailBatch(deps)
      .catch((error: unknown) => deps.log.error({ err: error }, 'email worker batch failed'))
      .finally(() => {
        if (!stopped) timer = setTimeout(tick, EMAIL_INTERVAL_MS)
      })
  }
  let timer = setTimeout(tick, 0)
  return async () => {
    stopped = true
    clearTimeout(timer)
    await running
  }
}
