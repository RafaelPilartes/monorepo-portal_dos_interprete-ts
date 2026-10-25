import { resolveCommit } from './lib/commit.js'
import { buildServer } from './server.js'

const port = Number(process.env.PORT ?? 3000)
const server = buildServer({ commit: resolveCommit(), logger: true })

// Railway and Docker need 0.0.0.0 (architecture.md §6).
server.listen({ host: '0.0.0.0', port }).catch((error: unknown) => {
  server.log.error(error)
  process.exit(1)
})
