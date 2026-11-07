import { execSync } from 'node:child_process'

/** Commit of the running build: GIT_COMMIT (set by the Docker build), else git, else "unknown". */
export function resolveCommit(env: NodeJS.ProcessEnv = process.env): string {
  if (env.GIT_COMMIT) return env.GIT_COMMIT
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'unknown'
  }
}
