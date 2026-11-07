// Sidebar of admin-web; its own module so the layout file only exports components.
// Grouped by the team's jobs (PRODUCT.md): the daily operation first, then people, verification,
// content and catalogs, and the administration of the platform.
import type { NavGroup, NavItem } from '@portal-dos-interpretes/ui/components/dashboard-layout'
import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileText,
  History,
  Home,
  Languages,
  MessageSquare,
  Scale,
  Settings,
  Shield,
  ShieldCheck,
  Tags,
  Undo2,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'

export const navigation: (NavItem | NavGroup)[] = [
  { name: 'Início', href: '/', icon: Home },
  {
    label: 'Operação',
    defaultOpen: true,
    items: [
      { name: 'Pedidos', href: '/requests', icon: ClipboardList },
      { name: 'Pagamentos', href: '/payments', icon: CreditCard },
      { name: 'Reembolsos', href: '/refunds', icon: Undo2 },
      { name: 'Repasses', href: '/payouts', icon: Wallet },
    ],
  },
  {
    label: 'Pessoas',
    defaultOpen: true,
    items: [
      { name: 'Intérpretes', href: '/interpreters', icon: Users },
      { name: 'Solicitantes', href: '/requesters', icon: UserCheck },
      { name: 'Organizações', href: '/organizations', icon: Building2 },
    ],
  },
  {
    label: 'Verificação',
    items: [
      { name: 'Pedidos de verificação', href: '/verifications/requests', icon: ShieldCheck },
      { name: 'Histórico', href: '/verifications/history', icon: FileCheck2 },
    ],
  },
  {
    label: 'Conteúdos e catálogos',
    items: [
      { name: 'Serviços', href: '/catalog/services', icon: Briefcase },
      { name: 'Línguas', href: '/catalog/languages', icon: Languages },
      { name: 'Especialidades', href: '/catalog/specialties', icon: Tags },
      { name: 'Testemunhos', href: '/content/testimonials', icon: MessageSquare },
      { name: 'Casos de sucesso', href: '/content/success-cases', icon: Award },
    ],
  },
  {
    label: 'Administração',
    items: [
      { name: 'Relatórios', href: '/reports', icon: BarChart3 },
      { name: 'Equipa', href: '/team', icon: Shield },
      { name: 'Auditoria', href: '/audit', icon: History },
      { name: 'Documentos legais', href: '/settings/legal', icon: Scale },
      { name: 'Tipos de documento', href: '/settings/document-types', icon: FileText },
      { name: 'Configuração', href: '/settings/config', icon: Settings },
    ],
  },
  {
    label: 'Comunidade',
    defaultOpen: false,
    items: [
      { name: 'Bolsa de oportunidades', href: '/community/opportunities', icon: Briefcase },
      { name: 'Eventos', href: '/community/events', icon: CalendarDays },
      { name: 'Apoio jurídico e ético', href: '/community/library/legal', icon: Scale },
    ],
  },
]
