import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PortalServicesProvider, SessionProvider, type PortalServices } from '@portal-dos-interpretes/auth'
import AcceptTerms from '@portal-dos-interpretes/auth/pages/AcceptTerms'
import Login from '@portal-dos-interpretes/auth/pages/Login'
import RecoverPassword from '@portal-dos-interpretes/auth/pages/RecoverPassword'
import ResetPassword from '@portal-dos-interpretes/auth/pages/ResetPassword'
import Suspended from '@portal-dos-interpretes/auth/pages/Suspended'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import { AppFooter } from '@portal-dos-interpretes/ui'
import NotFound from '@portal-dos-interpretes/ui/components/not-found'
import { StaffArea } from '@/components/StaffArea'
import AdminRoutes from '@/routes/AdminRoutes'

/** Admin app routes: the team area behind StaffArea, and the entry pages (architecture.md §3). */
export function AdminAppRoutes() {
  return (
    <Routes>
      <Route element={<StaffArea />}>{AdminRoutes()}</Route>
      <Route path="/login" element={<Login registerHref={null} app="admin" />} />
      <Route path="/recover-password" element={<RecoverPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-terms" element={<AcceptTerms />} />
      <Route path="/suspended" element={<Suspended />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export function App({ services }: { services: PortalServices }) {
  return (
    <AppProviders>
      <PortalServicesProvider services={services}>
        <SessionProvider source={services.source}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AdminAppRoutes />
          </BrowserRouter>
        </SessionProvider>
      </PortalServicesProvider>
      <AppFooter version={__APP_VERSION__} commit={__APP_COMMIT__} />
    </AppProviders>
  )
}
