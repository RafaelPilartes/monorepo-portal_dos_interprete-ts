import { navigation } from '@/navigation'
import { DashboardLayout } from "@portal-dos-interpretes/ui/components/dashboard-layout";



export default function InterpreterLayout() {
  return (
    <DashboardLayout
      navigation={navigation}
      userRole="interpreter"
      profileHref="/profile"
      settingsHref="/settings"
      userName="Maria Santos"
      userEmail="maria.santos@email.com"
    />
  );
}