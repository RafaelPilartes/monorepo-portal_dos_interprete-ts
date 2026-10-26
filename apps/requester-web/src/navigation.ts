// Sidebar of requester-web; its own module so the layout file only exports components.
import type { NavGroup, NavItem } from '@portal-dos-interpretes/ui/components/dashboard-layout'
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
  Building2,
  UsersRound,
} from "lucide-react";

export const navigation: (NavItem | NavGroup)[] = [
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
  {
    label: "Organização",
    items: [
      { name: "Dados", href: "/organization", icon: Building2 },
      { name: "Membros", href: "/organization/members", icon: UsersRound },
    ],
  },
  { name: "Minhas Avaliações", href: "/reviews", icon: Star },
  { name: "Meu Perfil", href: "/profile", icon: User },
  { name: "Configurações", href: "/settings", icon: Settings },
];
