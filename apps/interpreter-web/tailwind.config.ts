import type { Config } from 'tailwindcss'
import preset from '@portal-dos-interpretes/config/tailwind'

export default {
  presets: [preset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}', '../../packages/features/src/**/*.{ts,tsx}', '../../packages/auth/src/**/*.{ts,tsx}'],
} satisfies Config
