// Sidebar of requester-web; its own module so the layout file only exports components.
import type { NavGroup, NavItem } from '@portal-dos-interpretes/ui/components/dashboard-layout'
import {
  Home,
  Plus,
  FileText,
  Users,
  Heart,
  History,
  Star,
  User,
  Settings,
  Building2,
  CreditCard,
  UsersRound,
} from "lucide-react";

export const navigation: (NavItem | NavGroup)[] = [
  { name: "Início", href: "/", icon: Home },
  { name: "Nova solicitação", href: "/requests/new", icon: Plus },
  {
    label: "Pedidos",
    defaultOpen: true,
    items: [
      { name: "Em curso", href: "/requests", icon: FileText },
      { name: "Histórico", href: "/history", icon: History },
      { name: "Pagamentos", href: "/payments", icon: CreditCard },
      { name: "Avaliações", href: "/reviews", icon: Star },
    ],
  },
  {
    label: "Intérpretes",
    defaultOpen: true,
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
  { name: "Meu perfil", href: "/profile", icon: User },
  { name: "Configurações", href: "/settings", icon: Settings },
];
