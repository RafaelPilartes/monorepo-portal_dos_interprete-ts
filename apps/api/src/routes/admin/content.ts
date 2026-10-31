import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Database } from '../../lib/db.js'
import { actor, callSql } from '../../lib/routes.js'
import { requireStaff } from '../../plugins/staff.js'

// Content removal by the team (api.md §12, R-DIR-07): moderator and super_admin, with a reason.
// directory.remove_content audits it and tells the author (content_removed). The community steps
// add their types to TYPES.

const TYPES = { videos: 'video', articles: 'article' } as const
const params = z.object({ type: z.enum(['videos', 'articles']), id: z.string().uuid() })
const body = z.object({ reason: z.string().trim().max(500) })

export function registerContentRoutes(server: FastifyInstance, deps: { db: Database }): void {
  server.post('/admin/content/:type/:id/remove', { preHandler: requireStaff('moderator') }, async (request, reply) => {
    const { type, id } = params.parse(request.params)
    const { reason } = body.parse(request.body)
    await callSql(deps.db, request, 'SELECT directory.remove_content($1, $2, $3, $4)', [actor(request), TYPES[type], id, reason])
    return reply.status(204).send()
  })
}
