import AdminInterpreterDetails from '@/pages/dashboard/admin/AdminInterpreterDetails'
import AdminInterpreters from '@/pages/dashboard/admin/AdminInterpreters'
import AdminInterpreterVerifications from '@/pages/dashboard/admin/AdminInterpreterVerifications'
import AdminLayout from '@/pages/dashboard/admin/AdminLayout'
import AdminOverview from '@/pages/dashboard/admin/AdminOverview'
import AdminPayments from '@/pages/dashboard/admin/AdminPayments'
import AdminReports from '@/pages/dashboard/admin/AdminReports'
import AdminRequestDetails from '@/pages/dashboard/admin/AdminRequestDetails'
import AdminRequesterDetails from '@/pages/dashboard/admin/AdminRequesterDetails'
import AdminRequesters from '@/pages/dashboard/admin/AdminRequesters'
import AdminRequests from '@/pages/dashboard/admin/AdminRequests'
import AdminServices from '@/pages/dashboard/admin/AdminServices'
import AdminSettings from '@/pages/dashboard/admin/AdminSettings'
import AdminTeam from '@/pages/dashboard/admin/AdminTeam'
import AdminAudit from '@/pages/dashboard/admin/AdminAudit'
import AdminSuccessCases from '@/pages/dashboard/admin/AdminSuccessCases'
import AdminTestimonials from '@/pages/dashboard/admin/AdminTestimonials'
import AdminVerificationHistory from '@/pages/dashboard/admin/AdminVerificationHistory'
import AdminVerificationRequests from '@/pages/dashboard/admin/AdminVerificationRequests'
import ModulePlaceholder from '@/pages/dashboard/modules/ModulePlaceholder'
import { Route } from 'react-router-dom'

const AdminRoutes = () => {
  return (
    <Route path="/dashboard/admin" element={<AdminLayout />}>
      <Route index element={<AdminOverview />} />
      <Route path="interpreters" element={<AdminInterpreters />} />
      <Route path="interpreters/:id" element={<AdminInterpreterDetails />} />
      <Route
        path="interpreter-verifications"
        element={<AdminInterpreterVerifications />}
      />
      <Route path="requesters" element={<AdminRequesters />} />
      <Route path="requesters/:id" element={<AdminRequesterDetails />} />
      <Route path="requests" element={<AdminRequests />} />
      <Route path="requests/:id" element={<AdminRequestDetails />} />
      <Route path="testimonials" element={<AdminTestimonials />} />
      <Route path="success-cases" element={<AdminSuccessCases />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="services" element={<AdminServices />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="team" element={<AdminTeam />} />
      <Route path="audit" element={<AdminAudit />} />
      <Route
        path="verification-requests"
        element={<AdminVerificationRequests />}
      />
      <Route
        path="verification-history"
        element={<AdminVerificationHistory />}
      />

      {/* Admin Modules */}
      <Route
        path="modules/opportunities"
        element={
          <ModulePlaceholder
            title="Gestão de Oportunidades"
            description="Gerir vagas e pedidos no Portal."
          />
        }
      />
      <Route
        path="modules/library"
        element={
          <ModulePlaceholder
            title="Gestão da Biblioteca"
            description="Adicionar e rever materiais da biblioteca."
          />
        }
      />
      <Route
        path="modules/community"
        element={
          <ModulePlaceholder
            title="Comunidade"
            description="Moderação da área comunitária."
          />
        }
      />
      <Route
        path="modules/events"
        element={
          <ModulePlaceholder
            title="Gestão de Eventos"
            description="Adicionar e organizar eventos no portal."
          />
        }
      />
      <Route
        path="modules/training"
        element={
          <ModulePlaceholder
            title="Gestão de Formação"
            description="Administrar cursos e aprovações."
          />
        }
      />
      <Route
        path="modules/mentorship"
        element={
          <ModulePlaceholder
            title="Gestão de Mentorias"
            description="Gerir programas de tutoria."
          />
        }
      />
      <Route
        path="modules/forum"
        element={
          <ModulePlaceholder
            title="Gestão do Fórum"
            description="Moderação e aprovação de discussões."
          />
        }
      />
      <Route
        path="modules/legal"
        element={
          <ModulePlaceholder
            title="Gestão Jurídica/Ética"
            description="Administrar documentação e recursos de apoio."
          />
        }
      />
      <Route
        path="modules/benefits"
        element={
          <ModulePlaceholder
            title="Gestão de Parcerias"
            description="Acompanhar e adicionar novas parcerias."
          />
        }
      />
      <Route
        path="modules/support"
        element={
          <ModulePlaceholder
            title="Suporte e Ouvidoria"
            description="Responder a bilhetes e queixas no helpdesk."
          />
        }
      />
    </Route>
  )
}

export default AdminRoutes
