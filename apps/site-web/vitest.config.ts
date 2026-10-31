import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({ test: { environment: 'jsdom', setupFiles: ['@portal-dos-interpretes/ui/testing/setup-dom'] } }),
)
