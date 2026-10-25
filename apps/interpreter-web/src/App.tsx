import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '@portal-dos-interpretes/auth/pages/Login'
import RecoverPassword from '@portal-dos-interpretes/auth/pages/RecoverPassword'
import Register from '@portal-dos-interpretes/auth/pages/Register'
import { AppProviders } from '@portal-dos-interpretes/features/app/AppProviders'
import ArticlePage from '@portal-dos-interpretes/features/pages/ArticlePage'
import InterpreterArticles from '@portal-dos-interpretes/features/pages/InterpreterArticles'
import ColleagueProfile from '@portal-dos-interpretes/features/pages/InterpreterProfile'
import InterpreterVideos from '@portal-dos-interpretes/features/pages/InterpreterVideos'
import { AppFooter } from '@portal-dos-interpretes/ui'
import ModulePlaceholder from '@portal-dos-interpretes/ui/components/module-placeholder'
import NotFound from '@portal-dos-interpretes/ui/components/not-found'
import InterpreterAvailability from '@/pages/dashboard/interpreter/InterpreterAvailability'
import InterpreterDocuments from '@/pages/dashboard/interpreter/InterpreterDocuments'
import InterpreterEarnings from '@/pages/dashboard/interpreter/InterpreterEarnings'
import InterpreterLayout from '@/pages/dashboard/interpreter/InterpreterLayout'
import InterpreterOpenRequests from '@/pages/dashboard/interpreter/InterpreterOpenRequests'
import InterpreterOverview from '@/pages/dashboard/interpreter/InterpreterOverview'
import InterpreterProfilePage from '@/pages/dashboard/interpreter/InterpreterProfile'
import InterpreterRequestDetails from '@/pages/dashboard/interpreter/InterpreterRequestDetails'
import InterpreterRequests from '@/pages/dashboard/interpreter/InterpreterRequests'
import InterpreterReviews from '@/pages/dashboard/interpreter/InterpreterReviews'
import InterpreterSchedule from '@/pages/dashboard/interpreter/InterpreterSchedule'
import InterpreterSettings from '@/pages/dashboard/interpreter/InterpreterSettings'
import InterpreterVerification from '@/pages/dashboard/interpreter/InterpreterVerification'
import InterpreterProfileContact from '@/pages/dashboard/interpreter/profile/InterpreterProfileContact'
import InterpreterProfileContent from '@/pages/dashboard/interpreter/profile/InterpreterProfileContent'
import InterpreterProfileExperience from '@/pages/dashboard/interpreter/profile/InterpreterProfileExperience'
import InterpreterProfileOverview from '@/pages/dashboard/interpreter/profile/InterpreterProfileOverview'
import InterpreterProfileReviews from '@/pages/dashboard/interpreter/profile/InterpreterProfileReviews'
import InterpreterProfileServices from '@/pages/dashboard/interpreter/profile/InterpreterProfileServices'

const LATER = 'Esta área ainda não está disponível. Chega num dos próximos passos do Portal.'

// Areas the sidebar already lists but no screen exists yet (AD-017): honest placeholders.
const placeholders: { path: string; title: string; description: string }[] = [
  { path: 'opportunities', title: 'Bolsa de Oportunidades', description: 'Acesso a oportunidades de emprego e pedidos de interpretação.' },
  { path: 'events', title: 'Eventos e Masterclasses', description: 'Calendário de eventos, workshops e palestras.' },
  { path: 'library/legal', title: 'Apoio Jurídico e Ético', description: 'Sede para documentação, código de ética e linha de apoio.' },
  { path: 'library', title: 'Biblioteca de Recursos', description: LATER },
  { path: 'community/feed', title: 'Comunidade', description: LATER },
  { path: 'community/forum', title: 'Fórum', description: LATER },
  { path: 'training', title: 'Formação Contínua', description: LATER },
  { path: 'mentorship', title: 'Mentorias', description: LATER },
  { path: 'benefits', title: 'Benefícios e Parcerias', description: LATER },
  { path: 'support', title: 'Suporte e Ouvidoria', description: LATER },
]

/**
 * Interpreter routes at their new paths (architecture.md §3, interpreter-web): the
 * interpreter area, colleagues' profiles from packages/features and the entry pages.
 */
export function InterpreterAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<InterpreterLayout />}>
        <Route index element={<InterpreterOverview />} />
        <Route path="requests" element={<InterpreterRequests />} />
        <Route path="open-requests" element={<InterpreterOpenRequests />} />
        <Route path="requests/:id" element={<InterpreterRequestDetails />} />
        <Route path="schedule" element={<InterpreterSchedule />} />
        <Route path="availability" element={<InterpreterAvailability />} />
        <Route path="earnings" element={<InterpreterEarnings />} />
        <Route path="reviews" element={<InterpreterReviews />} />
        <Route path="profile" element={<InterpreterProfilePage />} />
        <Route path="profile/overview" element={<InterpreterProfileOverview />} />
        <Route path="profile/experience" element={<InterpreterProfileExperience />} />
        <Route path="profile/services" element={<InterpreterProfileServices />} />
        <Route path="profile/content" element={<InterpreterProfileContent />} />
        <Route path="profile/reviews" element={<InterpreterProfileReviews />} />
        <Route path="profile/contact" element={<InterpreterProfileContact />} />
        <Route path="verification" element={<InterpreterVerification />} />
        <Route path="verification/documents" element={<InterpreterDocuments />} />
        <Route path="settings" element={<InterpreterSettings />} />
        {placeholders.map(({ path, title, description }) => (
          <Route key={path} path={path} element={<ModulePlaceholder title={title} description={description} />} />
        ))}
        {/* The profile pages link back to the list; the colleagues' directory arrives in H4 (AD-017). */}
        <Route
          path="interpreters"
          element={<ModulePlaceholder title="Lista de Profissionais" description={LATER} />}
        />
        {/* Colleagues' public profiles (architecture.md §3: /interpreters/:slug). */}
        <Route path="interpreters/:slug" element={<ColleagueProfile />} />
        <Route path="interpreters/:slug/videos" element={<InterpreterVideos />} />
        <Route path="interpreters/:slug/articles" element={<InterpreterArticles />} />
        <Route path="interpreters/:slug/articles/:articleSlug" element={<ArticlePage />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register defaultAccountType="interpreter" />} />
      <Route path="/recover-password" element={<RecoverPassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <InterpreterAppRoutes />
      </BrowserRouter>
      <AppFooter version={__APP_VERSION__} commit={__APP_COMMIT__} />
    </AppProviders>
  )
}
