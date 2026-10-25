import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

// Request limits (api.md §1): public forms 5 per hour per IP; creating routes 60 per minute per
// account; everything else 300 per minute per account. The key is the account when there is one,
// else the IP — which is only trustworthy because trustProxy is a fixed hop count.
export const RATE_LIMITS = {
  publicForm: { max: 5, timeWindow: '1 hour' },
  create: { max: 60, timeWindow: '1 minute' },
} as const

export async function registerRateLimit(server: FastifyInstance): Promise<void> {
  await server.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    // After the auth plugin's onRequest hook, so the account is known.
    hook: 'preHandler',
    keyGenerator: (request) => (request.account ? `account:${request.account.id}` : `ip:${request.ip}`),
    // Requests refused by the auth plugin never reach this hook; they cost one local JWT check
    // (AD-028).
  })
}
