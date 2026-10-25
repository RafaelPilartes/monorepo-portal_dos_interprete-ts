import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '@portal-dos-interpretes/auth/pages/Login'
import RecoverPassword from '@portal-dos-interpretes/auth/pages/RecoverPassword'
import Register from '@portal-dos-interpretes/auth/pages/Register'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import ArticlePage from '@portal-dos-interpretes/features/pages/ArticlePage'
import InterpreterArticles from '@portal-dos-interpretes/features/pages/InterpreterArticles'
import InterpreterProfile from '@portal-dos-interpretes/features/pages/InterpreterProfile'
import InterpreterVideos from '@portal-dos-interpretes/features/pages/InterpreterVideos'
import { AppFooter } from '@portal-dos-interpretes/ui'
import NotFound from '@portal-dos-interpretes/ui/components/not-found'
import BrowseInterpreters from '@/pages/dashboard/requester/BrowseInterpreters'
import FavoriteInterpreters from '@/pages/dashboard/requester/FavoriteInterpreters'
import MyReviews from '@/pages/dashboard/requester/MyReviews'
import NewRequest from '@/pages/dashboard/requester/NewRequest'
import RequestDetails from '@/pages/dashboard/requester/RequestDetails'
import RequestHistory from '@/pages/dashboard/requester/RequestHistory'
import RequesterLayout from '@/pages/dashboard/requester/RequesterLayout'
import RequesterOverview from '@/pages/dashboard/requester/RequesterOverview'
import RequesterProfile from '@/pages/dashboard/requester/RequesterProfile'
import RequesterRequests from '@/pages/dashboard/requester/RequesterRequests'
import RequesterSettings from '@/pages/dashboard/requester/RequesterSettings'

/**
 * Requester routes at their new paths (architecture.md §3, requester-web): the
 * requester area, the interpreter profile pages from packages/features (D-05) and
 * the entry pages from packages/auth.
 */
export function RequesterAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RequesterLayout />}>
        <Route index element={<RequesterOverview />} />
        <Route path="requests" element={<RequesterRequests />} />
        <Route path="requests/new" element={<NewRequest />} />
        <Route path="requests/:id" element={<RequestDetails />} />
        <Route path="interpreters" element={<BrowseInterpreters />} />
        <Route path="favorites" element={<FavoriteInterpreters />} />
        <Route path="history" element={<RequestHistory />} />
        <Route path="reviews" element={<MyReviews />} />
        <Route path="profile" element={<RequesterProfile />} />
        <Route path="settings" element={<RequesterSettings />} />
        {/* Profile pages inside the requester layout, not the public header (AD-015). */}
        <Route path="interpreters/:slug" element={<InterpreterProfile />} />
        <Route path="interpreters/:slug/videos" element={<InterpreterVideos />} />
        <Route path="interpreters/:slug/articles" element={<InterpreterArticles />} />
        <Route path="interpreters/:slug/articles/:articleSlug" element={<ArticlePage />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recover-password" element={<RecoverPassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RequesterAppRoutes />
      </BrowserRouter>
      <AppFooter version={__APP_VERSION__} commit={__APP_COMMIT__} />
    </AppProviders>
  )
}
