import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'jsdom', setupFiles: ['@portal-dos-interpretes/ui/testing/setup-dom'] },
})
