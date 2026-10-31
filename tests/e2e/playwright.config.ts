import { defineConfig } from '@playwright/test'
import { ADMIN_STATE, API_URL, localSupabase, PANEL_STATE } from './local'

// Browser screens checked against the local dev servers (MASTER-PLAN.md, gate 4).
// Browsers: in the cloud VM they are pre-installed (PLAYWRIGHT_BROWSERS_PATH);
// elsewhere run `pnpm --filter @portal-dos-interpretes/e2e exec playwright install chromium`.
// The specs of the H steps need the local database: pnpm db:up && pnpm db:bootstrap-admin admin@portal.local.

const local = localSupabase()
// The apps and the API point at the local stack (values are the CLI's local development defaults).
const appEnv = {
  VITE_SUPABASE_URL: local?.API_URL ?? '',
  VITE_SUPABASE_ANON_KEY: local?.ANON_KEY ?? '',
  VITE_API_URL: API_URL,
}
const apiEnv = {
  DATABASE_URL: local?.DB_URL ?? '',
  SUPABASE_URL: local?.API_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY: local?.SERVICE_ROLE_KEY ?? '',
  APP_ORIGINS: 'http://localhost:5170,http://localhost:5171,http://localhost:5172,http://localhost:5173',
  SITE_URL: 'http://localhost:5170',
  REQUESTER_URL: 'http://localhost:5171',
  INTERPRETER_URL: 'http://localhost:5172',
  ADMIN_URL: 'http://localhost:5173',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '54325',
  EMAIL_FROM: 'Portal dos Intérpretes <no-reply@localhost>',
  LOG_LEVEL: 'warn',
}

export default defineConfig({
  testDir: './specs',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { viewport: { width: 1280, height: 800 } },
  projects: [
    { name: 'routes', testMatch: /site-routes\.spec\.ts$/ },
    { name: 'admin-login', testMatch: /admin\.setup\.ts$/ },
    { name: 'panel-login', testMatch: /panel\.setup\.ts$/ },
    { name: 'admin', testMatch: /(admin-routes|h1-.*|h3-.*)\.spec\.ts$/, dependencies: ['admin-login'], use: { storageState: ADMIN_STATE } },
    { name: 'panels', testMatch: /(requester|interpreter)-routes\.spec\.ts$/, dependencies: ['panel-login'], use: { storageState: PANEL_STATE } },
    { name: 'h2', testMatch: /h2-.*\.spec\.ts$/, dependencies: ['admin-login'], use: { storageState: ADMIN_STATE } },
    { name: 'h4', testMatch: /h4-.*\.spec\.ts$/ },
  ],
  webServer: [
    {
      command: 'pnpm --filter @portal-dos-interpretes/site-web exec vite --port 5170 --strictPort',
      url: 'http://localhost:5170',
      reuseExistingServer: true,
      timeout: 120_000,
      env: appEnv,
    },
    {
      command: 'pnpm --filter @portal-dos-interpretes/requester-web exec vite --port 5171 --strictPort',
      url: 'http://localhost:5171',
      reuseExistingServer: true,
      timeout: 120_000,
      env: appEnv,
    },
    {
      command: 'pnpm --filter @portal-dos-interpretes/interpreter-web exec vite --port 5172 --strictPort',
      url: 'http://localhost:5172',
      reuseExistingServer: true,
      timeout: 120_000,
      env: appEnv,
    },
    {
      command: 'pnpm --filter @portal-dos-interpretes/admin-web exec vite --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
      env: appEnv,
    },
    {
      command: 'pnpm --filter @portal-dos-interpretes/api exec tsx src/index.ts',
      url: `${API_URL}/health`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: apiEnv,
    },
  ],
})
