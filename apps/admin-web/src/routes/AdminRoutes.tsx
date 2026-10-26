import AdminAccountDetails from '@/pages/accounts/AdminAccountDetails'
import AdminAccounts from '@/pages/accounts/AdminAccounts'
import AdminOrganizationDetails from '@/pages/accounts/AdminOrganizationDetails'
import AdminOrganizations from '@/pages/accounts/AdminOrganizations'
import AdminInterpreterVerifications from '@/pages/dashboard/admin/AdminInterpreterVerifications'
import AdminLayout from '@/pages/dashboard/admin/AdminLayout'
import AdminOverview from '@/pages/dashboard/admin/AdminOverview'
import AdminPayments from '@/pages/dashboard/admin/AdminPayments'
import AdminReports from '@/pages/dashboard/admin/AdminReports'
import AdminRequestDetails from '@/pages/dashboard/admin/AdminRequestDetails'
import AdminRequests from '@/pages/dashboard/admin/AdminRequests'
import AdminServices from '@/pages/dashboard/admin/AdminServices'
import AdminSettings from '@/pages/dashboard/admin/AdminSettings'
import AdminTeam from '@/pages/dashboard/admin/AdminTeam'
import AdminAudit from '@/pages/dashboard/admin/AdminAudit'
import AdminDocumentTypes from '@/pages/dashboard/admin/AdminDocumentTypes'
import AdminLegal from '@/pages/dashboard/admin/AdminLegal'
import AdminSuccessCases from '@/pages/dashboard/admin/AdminSuccessCases'
import AdminTestimonials from '@/pages/dashboard/admin/AdminTestimonials'
import AdminVerificationHistory from '@/pages/dashboard/admin/AdminVerificationHistory'
import AdminVerificationRequests from '@/pages/dashboard/admin/AdminVerificationRequests'
import { RequireStaffLevel } from '@portal-dos-interpretes/auth'
import ModulePlaceholder from '@portal-dos-interpretes/ui/components/module-placeholder'
import { Route } from 'react-router-dom'

/** Admin routes at their new paths (architecture.md §3, admin-web; AD-005 for verifications). */
const AdminRoutes = () => {
  return (
    <Route path="/" element={<AdminLayout />}>
      <Route index element={<AdminOverview />} />
      <Route path="interpreters" element={<AdminAccounts kind="interpreter" />} />
      <Route path="interpreters/:id" element={<AdminAccountDetails kind="interpreter" />} />
      <Route
        path="verifications"
        element={<AdminInterpreterVerifications />}
      />
      <Route path="requesters" element={<AdminAccounts kind="requester" />} />
      <Route path="requesters/:id" element={<AdminAccountDetails kind="requester" />} />
      <Route path="organizations" element={<AdminOrganizations />} />
      <Route path="organizations/:id" element={<AdminOrganizationDetails />} />
      <Route path="requests" element={<AdminRequests />} />
      <Route path="requests/:id" element={<AdminRequestDetails />} />
      <Route path="content/testimonials" element={<AdminTestimonials />} />
      <Route path="content/success-cases" element={<AdminSuccessCases />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="catalog/services" element={<AdminServices />} />
      {/* R-STF-01: configuration, legal documents and the team are super_admin's; document types
          also the moderator's (super_admin passes every check). */}
      <Route path="settings/config" element={<RequireStaffLevel levels={['super_admin']}><AdminSettings /></RequireStaffLevel>} />
      <Route path="settings/legal" element={<RequireStaffLevel levels={['super_admin']}><AdminLegal /></RequireStaffLevel>} />
      <Route path="settings/document-types" element={<RequireStaffLevel levels={['moderator']}><AdminDocumentTypes /></RequireStaffLevel>} />
      <Route path="team" element={<RequireStaffLevel levels={['super_admin']}><AdminTeam /></RequireStaffLevel>} />
      <Route path="audit" element={<AdminAudit />} />
      <Route
        path="verifications/requests"
        element={<AdminVerificationRequests />}
      />
      <Route
        path="verifications/history"
        element={<AdminVerificationHistory />}
      />

      {/* Admin Modules */}
      <Route
        path="community/opportunities"
        element={
          <ModulePlaceholder
            title="Gestão de Oportunidades"
            description="Gerir vagas e pedidos no Portal."
          />
        }
      />
      <Route
        path="community/library"
        element={
          <ModulePlaceholder
            title="Gestão da Biblioteca"
            description="Adicionar e rever materiais da biblioteca."
          />
        }
      />
      <Route
        path="community/feed"
        element={
          <ModulePlaceholder
            title="Comunidade"
            description="Moderação da área comunitária."
          />
        }
      />
      <Route
        path="community/events"
        element={
          <ModulePlaceholder
            title="Gestão de Eventos"
            description="Adicionar e organizar eventos no portal."
          />
        }
      />
      <Route
        path="community/training"
        element={
          <ModulePlaceholder
            title="Gestão de Formação"
            description="Administrar cursos e aprovações."
          />
        }
      />
      <Route
        path="community/mentorship"
        element={
          <ModulePlaceholder
            title="Gestão de Mentorias"
            description="Gerir programas de tutoria."
          />
        }
      />
      <Route
        path="community/forum"
        element={
          <ModulePlaceholder
            title="Gestão do Fórum"
            description="Moderação e aprovação de discussões."
          />
        }
      />
      <Route
        path="community/library/legal"
        element={
          <ModulePlaceholder
            title="Gestão Jurídica/Ética"
            description="Administrar documentação e recursos de apoio."
          />
        }
      />
      <Route
        path="community/partners"
        element={
          <ModulePlaceholder
            title="Gestão de Parcerias"
            description="Acompanhar e adicionar novas parcerias."
          />
        }
      />
      <Route
        path="support/tickets"
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
