import type React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppFooter } from '@portal-dos-interpretes/ui'
import { Toaster as Sonner } from '@portal-dos-interpretes/ui/components/sonner'
import { ThemeProvider } from '@portal-dos-interpretes/ui/components/theme-provider'
import { Toaster } from '@portal-dos-interpretes/ui/components/toaster'
import { TooltipProvider } from '@portal-dos-interpretes/ui/components/tooltip'
import { PublicLayout } from '@/components/layout/PublicLayout'
import NotFound from '@/pages/NotFound'
import Contact from '@/pages/portal/Contact'
import ForInterpreters from '@/pages/portal/ForInterpreters'
import ForRequesters from '@/pages/portal/ForRequesters'
import Home from '@/pages/portal/Home'
import HowItWorks from '@/pages/portal/HowItWorks'
import Impact from '@/pages/portal/Impact'
import Interpreters from '@/pages/portal/Interpreters'
import Services from '@/pages/portal/Services'
import Tutorials from '@/pages/portal/Tutorials'

const queryClient = new QueryClient()

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

/** Theme, data cache, tooltips and toasts shared by every screen. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SiteRoutes />
      </BrowserRouter>
      <AppFooter version={__APP_VERSION__} commit={__APP_COMMIT__} />
    </AppProviders>
  )
}
