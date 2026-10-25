import { defineConfig } from 'vite'
import { createViteConfig } from '@portal-dos-interpretes/config/vite'

export default defineConfig(createViteConfig({ port: 5170, root: import.meta.dirname }))
