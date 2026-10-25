import { navigation } from '@/navigation'
import { DashboardLayout } from '@portal-dos-interpretes/ui/components/dashboard-layout'


export default function AdminLayout() {
  return (
    <DashboardLayout
      navigation={navigation}
      userRole="admin"
      userName="Admin Portal"
      userEmail="admin@portaldosinterpretes.ao"
      settingsHref="/settings/config"
    />
  )
}
