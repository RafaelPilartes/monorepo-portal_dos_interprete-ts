import { defineConfig } from '@playwright/test'

// Browser screens checked against the local dev servers (MASTER-PLAN.md, gate 4).
// Browsers: in the cloud VM they are pre-installed (PLAYWRIGHT_BROWSERS_PATH);
// elsewhere run `pnpm --filter @portal-dos-interpretes/e2e exec playwright install chromium`.
export default defineConfig({
  testDir: './specs',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { viewport: { width: 1280, height: 800 } },
  webServer: [
    {
      command: 'pnpm --filter @portal-dos-interpretes/site-web exec vite --port 5170 --strictPort',
      url: 'http://localhost:5170',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @portal-dos-interpretes/admin-web exec vite --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
