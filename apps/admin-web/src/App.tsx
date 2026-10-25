import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '@portal-dos-interpretes/auth/pages/Login'
import RecoverPassword from '@portal-dos-interpretes/auth/pages/RecoverPassword'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import { AppFooter } from '@portal-dos-interpretes/ui'
import NotFound from '@portal-dos-interpretes/ui/components/not-found'
import AdminRoutes from '@/routes/AdminRoutes'

/** Admin app routes: the team area, plus the entry pages from packages/auth (architecture.md §3). */
export function AdminAppRoutes() {
  return (
    <Routes>
      {AdminRoutes()}
      <Route path="/login" element={<Login registerHref={null} />} />
      <Route path="/recover-password" element={<RecoverPassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminAppRoutes />
      </BrowserRouter>
      <AppFooter version={__APP_VERSION__} commit={__APP_COMMIT__} />
    </AppProviders>
  )
}
