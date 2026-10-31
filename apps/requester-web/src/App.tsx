import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PanelLayout, PortalServicesProvider, RequireRole, SessionProvider, type PortalServices } from '@portal-dos-interpretes/auth'
import AcceptInvite from '@portal-dos-interpretes/auth/pages/AcceptInvite'
import AcceptTerms from '@portal-dos-interpretes/auth/pages/AcceptTerms'
import Login from '@portal-dos-interpretes/auth/pages/Login'
import { OrganizationOnboarding, RequesterOnboarding } from '@portal-dos-interpretes/auth/pages/Onboarding'
import RecoverPassword from '@portal-dos-interpretes/auth/pages/RecoverPassword'
import Register from '@portal-dos-interpretes/auth/pages/Register'
import ResetPassword from '@portal-dos-interpretes/auth/pages/ResetPassword'
import Suspended from '@portal-dos-interpretes/auth/pages/Suspended'
import VerifyEmail from '@portal-dos-interpretes/auth/pages/VerifyEmail'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import ArticlePage from '@portal-dos-interpretes/features/pages/ArticlePage'
import InterpreterArticles from '@portal-dos-interpretes/features/pages/InterpreterArticles'
import InterpreterProfile from '@portal-dos-interpretes/features/pages/InterpreterProfile'
import InterpreterVideos from '@portal-dos-interpretes/features/pages/InterpreterVideos'
import { AppFooter } from '@portal-dos-interpretes/ui'
import NotFound from '@portal-dos-interpretes/ui/components/not-found'
import { RequesterDirectory } from '@/directory'
import { navigation } from '@/navigation'
import OrganizationMembers from '@/pages/organization/OrganizationMembers'
import OrganizationPage from '@/pages/organization/OrganizationPage'
import BrowseInterpreters from '@/pages/dashboard/requester/BrowseInterpreters'
import FavoriteInterpreters from '@/pages/dashboard/requester/FavoriteInterpreters'
import MyReviews from '@/pages/dashboard/requester/MyReviews'
import NewRequest from '@/pages/dashboard/requester/NewRequest'
import RequestDetails from '@/pages/dashboard/requester/RequestDetails'
import RequestHistory from '@/pages/dashboard/requester/RequestHistory'
import RequesterOverview from '@/pages/dashboard/requester/RequesterOverview'
import RequesterProfile from '@/pages/dashboard/requester/RequesterProfile'
import RequesterRequests from '@/pages/dashboard/requester/RequesterRequests'
import RequesterSettings from '@/pages/dashboard/requester/RequesterSettings'

/** The requester area: a session with the requester role (R-ACC-02), in the panel layout. */
function RequesterArea() {
  return (
    <RequireRole role="requester">
      <RequesterDirectory>
        <PanelLayout navigation={navigation} app="requester" profileHref="/profile" settingsHref="/settings" />
      </RequesterDirectory>
    </RequireRole>
  )
}

/**
 * Requester routes (architecture.md §3, requester-web): the requester area, the interpreter
 * profile pages from packages/features (D-05), the organisation, and the entry pages from
 * packages/auth (accounts-and-organizations.md).
 */
export function RequesterAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RequesterArea />}>
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
        <Route path="organization" element={<OrganizationPage />} />
        <Route path="organization/members" element={<OrganizationMembers />} />
        {/* Profile pages inside the requester layout, not the public header (AD-015). */}
        <Route path="interpreters/:slug" element={<InterpreterProfile />} />
        <Route path="interpreters/:slug/videos" element={<InterpreterVideos />} />
        <Route path="interpreters/:slug/articles" element={<InterpreterArticles />} />
        <Route path="interpreters/:slug/articles/:articleSlug" element={<ArticlePage />} />
      </Route>
      <Route path="/login" element={<Login app="requester" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recover-password" element={<RecoverPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail app="requester" />} />
      <Route path="/accept-terms" element={<AcceptTerms app="requester" />} />
      <Route path="/suspended" element={<Suspended />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route path="/onboarding" element={<RequesterOnboarding />} />
      <Route path="/onboarding/organization" element={<OrganizationOnboarding />} />
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
            <RequesterAppRoutes />
          </BrowserRouter>
        </SessionProvider>
      </PortalServicesProvider>
      <AppFooter version={__APP_VERSION__} commit={__APP_COMMIT__} />
    </AppProviders>
  )
}
