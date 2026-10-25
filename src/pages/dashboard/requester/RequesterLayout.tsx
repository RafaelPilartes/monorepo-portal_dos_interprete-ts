import { DashboardLayout, NavItem, NavGroup } from "@/components/layout/DashboardLayout";
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
  { name: "Dashboard", href: "/dashboard/requester", icon: LayoutDashboard },
  { name: "Nova Solicitação", href: "/dashboard/requester/requests/new", icon: Plus },
  {
    label: "Solicitações",
    defaultOpen: true,
    items: [
      { name: "Minhas Solicitações", href: "/dashboard/requester/requests", icon: FileText },
      { name: "Histórico", href: "/dashboard/requester/history", icon: History },
    ],
  },
  {
    label: "Intérpretes",
    items: [
      { name: "Procurar", href: "/dashboard/requester/interpreters", icon: Users },
      { name: "Favoritos", href: "/dashboard/requester/favorites", icon: Heart },
    ],
  },
  { name: "Minhas Avaliações", href: "/dashboard/requester/reviews", icon: Star },
  { name: "Meu Perfil", href: "/dashboard/requester/profile", icon: User },
  { name: "Configurações", href: "/dashboard/requester/settings", icon: Settings },
];

export default function RequesterLayout() {
  return (
    <DashboardLayout
      navigation={navigation}
      userRole="solicitante"
      userName="João Silva"
      userEmail="joao.silva@exemplo.com"
    />
  );
}