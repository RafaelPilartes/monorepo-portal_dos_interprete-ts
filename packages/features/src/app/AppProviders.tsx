import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster as Sonner } from '@portal-dos-interpretes/ui/components/sonner'
import { ThemeProvider } from '@portal-dos-interpretes/ui/components/theme-provider'
import { Toaster } from '@portal-dos-interpretes/ui/components/toaster'
import { TooltipProvider } from '@portal-dos-interpretes/ui/components/tooltip'

const queryClient = new QueryClient()

/** Theme, data cache, tooltips and toasts shared by every screen of every app (was legacy/src/App.tsx). */
export function AppProviders({ children }: { children: ReactNode }) {
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
