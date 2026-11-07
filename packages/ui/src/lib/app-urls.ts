/** The four web apps (D-80). */
export type AppName = 'site' | 'requester' | 'interpreter' | 'admin'

// Development defaults (AD-006); each deployment sets VITE_<APP>_URL.
const DEFAULT_URLS: Record<AppName, string> = {
  site: 'http://localhost:5170',
  requester: 'http://localhost:5171',
  interpreter: 'http://localhost:5172',
  admin: 'http://localhost:5173',
}

function readEnv(app: AppName): string | undefined {
  const env = import.meta.env
  const value = {
    site: env.VITE_SITE_URL,
    requester: env.VITE_REQUESTER_URL,
    interpreter: env.VITE_INTERPRETER_URL,
    admin: env.VITE_ADMIN_URL,
  }[app]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Absolute URL of `path` inside another app (links between apps, foundation.md §D item 3). */
export function appUrl(app: AppName, path = '/'): string {
  const base = (readEnv(app) ?? DEFAULT_URLS[app]).replace(/\/+$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
