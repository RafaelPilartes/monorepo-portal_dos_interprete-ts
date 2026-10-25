import {
  DashboardLayout,
  NavItem,
  NavGroup
} from '@/components/layout/DashboardLayout'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  MessageSquare,
  Award,
  BarChart3,
  CreditCard,
  Briefcase,
  Settings,
  Shield,
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserPlus,
  Scale,
  Gift,
  HelpCircle,
  History
} from 'lucide-react'
const navigation: (NavItem | NavGroup)[] = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  {
    label: 'Utilizadores',
    defaultOpen: true,
    items: [
      {
        name: 'Intérpretes',
        href: '/dashboard/admin/interpreters',
        icon: Users
      },
      {
        name: 'Solicitantes',
        href: '/dashboard/admin/requesters',
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
        href: '/dashboard/admin/verification-requests',
        icon: Shield
      },
      {
        name: 'Histórico',
        href: '/dashboard/admin/verification-history',
        icon: FileText
      }
    ]
  },
  { name: 'Solicitações', href: '/dashboard/admin/requests', icon: FileText },
  {
    label: 'Conteúdos',
    items: [
      {
        name: 'Testemunhos',
        href: '/dashboard/admin/testimonials',
        icon: MessageSquare
      },
      {
        name: 'Casos de Sucesso',
        href: '/dashboard/admin/success-cases',
        icon: Award
      }
    ]
  },
  {
    label: 'Gestão',
    items: [
      { name: 'Relatórios', href: '/dashboard/admin/reports', icon: BarChart3 },
      {
        name: 'Pagamentos',
        href: '/dashboard/admin/payments',
        icon: CreditCard
      },
      { name: 'Serviços', href: '/dashboard/admin/services', icon: Briefcase }
    ]
  },
  {
    label: 'Administração',
    defaultOpen: true,
    items: [
      { name: 'Equipa', href: '/dashboard/admin/team', icon: Shield },
      { name: 'Auditoria & Logs', href: '/dashboard/admin/audit', icon: History }
    ]
  },
  {
    label: 'Módulos',
    defaultOpen: false,
    items: [
      {
        name: 'Bolsa de Oportunidades',
        href: '/dashboard/admin/modules/opportunities',
        icon: Briefcase
      },
      {
        name: 'Eventos',
        href: '/dashboard/admin/modules/events',
        icon: CalendarDays
      },
      {
        name: 'Apoio Jurídico e Ético',
        href: '/dashboard/admin/modules/legal',
        icon: Scale
      }
    ]
  },
  { name: 'Configurações', href: '/dashboard/admin/settings', icon: Settings }
]

export default function AdminLayout() {
  return (
    <DashboardLayout
      navigation={navigation}
      userRole="admin"
      userName="Admin Portal"
      userEmail="admin@portaldosinterpretes.ao"
    />
  )
}
