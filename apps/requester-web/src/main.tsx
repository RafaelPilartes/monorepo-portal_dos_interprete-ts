import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@portal-dos-interpretes/ui/styles.css'
import { createServicesFromEnv, type PortalServices } from '@portal-dos-interpretes/auth'
import { App } from './App'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

let services: PortalServices | undefined
try {
  services = createServicesFromEnv()
} catch (error) {
  // Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY nothing works; say so instead of a blank page.
  console.error(error)
  rootElement.textContent = 'A aplicação não está configurada: faltam as variáveis do Supabase (ver .env.example).'
}

if (services) {
  createRoot(rootElement).render(
    <StrictMode>
      <App services={services} />
    </StrictMode>,
  )
}
