import { navigation } from '@/navigation'
import { useRequiredPortalServices, useSession } from '@portal-dos-interpretes/auth'
import { DashboardLayout } from '@portal-dos-interpretes/ui/components/dashboard-layout'

export default function AdminLayout() {
  const session = useSession()
  const services = useRequiredPortalServices()
  const account = session.status === 'authenticated' ? session.account : null
  return (
    <DashboardLayout
      navigation={navigation}
      userRole="admin"
      userName={account?.fullName ?? ''}
      userEmail={account?.email ?? ''}
      settingsHref="/settings/config"
      onSignOut={() => services.session.signOut()}
    />
  )
}
