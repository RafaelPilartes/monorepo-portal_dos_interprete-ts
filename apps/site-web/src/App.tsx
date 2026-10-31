import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import { AppFooter } from '@portal-dos-interpretes/ui'
import NotFound from '@portal-dos-interpretes/ui/components/not-found'
import { PublicLayout } from '@/components/layout/PublicLayout'
import Contact from '@/pages/portal/Contact'
import ForInterpreters from '@/pages/portal/ForInterpreters'
import ForRequesters from '@/pages/portal/ForRequesters'
import Home from '@/pages/portal/Home'
import HowItWorks from '@/pages/portal/HowItWorks'
import Impact from '@/pages/portal/Impact'
import Interpreters from '@/pages/portal/Interpreters'
import Services from '@/pages/portal/Services'
import Tutorials from '@/pages/portal/Tutorials'
import { SiteDataProvider, type SiteData } from '@/data/catalog'

/** Public site routes (architecture.md §3, site-web). */
export function SiteRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="services" element={<Services />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="impact" element={<Impact />} />
        <Route path="contact" element={<Contact />} />
        <Route path="for-requesters" element={<ForRequesters />} />
        <Route path="for-interpreters" element={<ForInterpreters />} />
        <Route path="interpreters" element={<Interpreters />} />
        <Route path="tutorials" element={<Tutorials />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export function App({ data = null }: { data?: SiteData | null } = {}) {
  return (
    <AppProviders>
      <SiteDataProvider data={data}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SiteRoutes />
        </BrowserRouter>
      </SiteDataProvider>
      <AppFooter version={__APP_VERSION__} commit={__APP_COMMIT__} />
    </AppProviders>
  )
}
