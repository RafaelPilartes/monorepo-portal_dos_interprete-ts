import InterpreterAvailability from '@/pages/dashboard/interpreter/InterpreterAvailability'
import InterpreterDocuments from '@/pages/dashboard/interpreter/InterpreterDocuments'
import InterpreterEarnings from '@/pages/dashboard/interpreter/InterpreterEarnings'
import InterpreterLayout from '@/pages/dashboard/interpreter/InterpreterLayout'
import InterpreterOpenRequests from '@/pages/dashboard/interpreter/InterpreterOpenRequests'
import InterpreterOverview from '@/pages/dashboard/interpreter/InterpreterOverview'
import InterpreterRequestDetails from '@/pages/dashboard/interpreter/InterpreterRequestDetails'
import InterpreterProfilePage from '@/pages/dashboard/interpreter/InterpreterProfile'
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
import ModulePlaceholder from '@/pages/dashboard/modules/ModulePlaceholder'
import { Route } from 'react-router-dom'

const InterpreterRoutes = () => {
  return (
    <Route path="/dashboard/interpreter" element={<InterpreterLayout />}>
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
      <Route
        path="profile/experience"
        element={<InterpreterProfileExperience />}
      />
      <Route path="profile/services" element={<InterpreterProfileServices />} />
      <Route path="profile/content" element={<InterpreterProfileContent />} />
      <Route path="profile/reviews" element={<InterpreterProfileReviews />} />
      <Route path="profile/contact" element={<InterpreterProfileContact />} />
      <Route path="verification" element={<InterpreterVerification />} />
      <Route path="documents" element={<InterpreterDocuments />} />
      <Route path="settings" element={<InterpreterSettings />} />

      {/* Interpreter Modules */}
      <Route
        path="opportunities"
        element={
          <ModulePlaceholder
            title="Bolsa de Oportunidades"
            description="Acesso a oportunidades de emprego e pedidos de interpretação."
          />
        }
      />
      <Route
        path="events"
        element={
          <ModulePlaceholder
            title="Eventos e Masterclasses"
            description="Calendário de eventos, workshops e palestras."
          />
        }
      />
      <Route
        path="legal"
        element={
          <ModulePlaceholder
            title="Apoio Jurídico e Ético"
            description="Sede para documentação, código de ética e linha de apoio."
          />
        }
      />
    </Route>
  )
}

export default InterpreterRoutes
