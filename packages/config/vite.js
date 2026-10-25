// Shared Vite config factory for the four web apps.
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react-swc'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** The single monorepo version (architecture.md §9). */
export function readRootVersion() {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).version
}

/** Short commit of the working tree, or "unknown" outside git. */
export function readCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

/**
 * @param {{ port: number, root: string }} options root is the app directory (import.meta.dirname)
 */
export function createViteConfig({ port, root }) {
  return {
    plugins: [react()],
    // No server.host: AD-004 (the cloud VM has no IPv6).
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
    resolve: { alias: { '@': path.resolve(root, 'src') } },
    define: {
      __APP_VERSION__: JSON.stringify(readRootVersion()),
      __APP_COMMIT__: JSON.stringify(readCommit()),
    },
  }
}
