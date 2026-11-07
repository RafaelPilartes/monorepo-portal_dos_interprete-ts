import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster as Sonner } from '@portal-dos-interpretes/ui/components/sonner'
import { ThemeProvider } from '@portal-dos-interpretes/ui/components/theme-provider'
import { Toaster } from '@portal-dos-interpretes/ui/components/toaster'
import { TooltipProvider } from '@portal-dos-interpretes/ui/components/tooltip'

// The data layer already retries transient failures (supabase-js repeats a 503 three times), so a
// query that still fails shows its error at once instead of after another round of retries.
function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

/** Theme, data cache, tooltips and toasts shared by every screen of every app (was the old SPA's src/App.tsx, in git up to v0.5.0). */
export function AppProviders({ children }: { children: ReactNode }) {
  // One cache per mounted app (and per test render), never shared between them.
  const [queryClient] = useState(createQueryClient)
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
