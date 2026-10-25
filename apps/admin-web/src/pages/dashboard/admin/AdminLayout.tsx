import {
  DashboardLayout,
  NavItem,
  NavGroup
} from '@portal-dos-interpretes/ui/components/dashboard-layout'
import { LayoutDashboard, Users, UserCheck, FileText, MessageSquare, Award, BarChart3, CreditCard, Briefcase, Settings, Shield, CalendarDays, Scale, History } from 'lucide-react';
const navigation: (NavItem | NavGroup)[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    label: 'Utilizadores',
    defaultOpen: true,
    items: [
      {
        name: 'Intérpretes',
        href: '/interpreters',
        icon: Users
      },
      {
        name: 'Solicitantes',
        href: '/requesters',
        icon: UserCheck
      }
    ]
  },
  {
    label: 'Verificação Paga',
    defaultOpen: true,
    items: [
      {
        name: 'Solicitações',
        href: '/verifications/requests',
        icon: Shield
      },
      {
        name: 'Histórico',
        href: '/verifications/history',
        icon: FileText
      }
    ]
  },
  { name: 'Solicitações', href: '/requests', icon: FileText },
  {
    label: 'Conteúdos',
    items: [
      {
        name: 'Testemunhos',
        href: '/content/testimonials',
        icon: MessageSquare
      },
      {
        name: 'Casos de Sucesso',
        href: '/content/success-cases',
        icon: Award
      }
    ]
  },
  {
    label: 'Gestão',
    items: [
      { name: 'Relatórios', href: '/reports', icon: BarChart3 },
      {
        name: 'Pagamentos',
        href: '/payments',
        icon: CreditCard
      },
      { name: 'Serviços', href: '/catalog/services', icon: Briefcase }
    ]
  },
  {
    label: 'Administração',
    defaultOpen: true,
    items: [
      { name: 'Equipa', href: '/team', icon: Shield },
      { name: 'Auditoria & Logs', href: '/audit', icon: History }
    ]
  },
  {
    label: 'Módulos',
    defaultOpen: false,
    items: [
      {
        name: 'Bolsa de Oportunidades',
        href: '/community/opportunities',
        icon: Briefcase
      },
      {
        name: 'Eventos',
        href: '/community/events',
        icon: CalendarDays
      },
      {
        name: 'Apoio Jurídico e Ético',
        href: '/community/library/legal',
        icon: Scale
      }
    ]
  },
  { name: 'Configurações', href: '/settings/config', icon: Settings }
]

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
