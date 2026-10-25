import { navigation } from '@/navigation'
import { DashboardLayout } from "@portal-dos-interpretes/ui/components/dashboard-layout";



export default function RequesterLayout() {
  return (
    <DashboardLayout
      navigation={navigation}
      userRole="requester"
      profileHref="/profile"
      settingsHref="/settings"
      userName="João Silva"
      userEmail="joao.silva@exemplo.com"
    />
  );
}