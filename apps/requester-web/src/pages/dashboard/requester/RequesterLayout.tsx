import { DashboardLayout, NavItem, NavGroup } from "@portal-dos-interpretes/ui/components/dashboard-layout";
import {
  LayoutDashboard,
  Plus,
  FileText,
  Users,
  Heart,
  History,
  Star,
  User,
  Settings,
} from "lucide-react";

const navigation: (NavItem | NavGroup)[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Nova Solicitação", href: "/requests/new", icon: Plus },
  {
    label: "Solicitações",
    defaultOpen: true,
    items: [
      { name: "Minhas Solicitações", href: "/requests", icon: FileText },
      { name: "Histórico", href: "/history", icon: History },
    ],
  },
  {
    label: "Intérpretes",
    items: [
      { name: "Procurar", href: "/interpreters", icon: Users },
      { name: "Favoritos", href: "/favorites", icon: Heart },
    ],
  },
  { name: "Minhas Avaliações", href: "/reviews", icon: Star },
  { name: "Meu Perfil", href: "/profile", icon: User },
  { name: "Configurações", href: "/settings", icon: Settings },
];

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