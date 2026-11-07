// Sidebar of interpreter-web; its own module so the layout file only exports components.
import type { NavGroup, NavItem } from '@portal-dos-interpretes/ui/components/dashboard-layout'
import {
  Home,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Star,
  FileCheck,
  Settings,
  Users,
  Briefcase,
  Video,
  Phone,
  Eye,
  Shield,
  BookOpen,
  MessageSquare,
  CalendarDays,
  GraduationCap,
  UserPlus,
  Scale,
  Gift,
  HelpCircle,
} from "lucide-react";

export const navigation: (NavItem | NavGroup)[] = [
  { name: "Início", href: "/", icon: Home },
  {
    label: "Trabalho",
    defaultOpen: true,
    items: [
      { name: "Solicitações", href: "/requests", icon: FileText },
      { name: "Solicitações abertas", href: "/open-requests", icon: Users },
      { name: "Agenda", href: "/schedule", icon: Calendar },
      { name: "Disponibilidade", href: "/availability", icon: Clock },
      { name: "Avaliações", href: "/reviews", icon: Star },
      { name: "Ganhos", href: "/earnings", icon: DollarSign },
    ],
  },
  {
    label: "Perfil público",
    items: [
      { name: "Visão geral", href: "/profile/overview", icon: Eye },
      { name: "Experiência", href: "/profile/experience", icon: Briefcase },
      { name: "Serviços e preços", href: "/profile/services", icon: Settings },
      { name: "Conteúdos", href: "/profile/content", icon: Video },
      { name: "Avaliações recebidas", href: "/profile/reviews", icon: Star },
      { name: "Contacto", href: "/profile/contact", icon: Phone },
    ],
  },
  {
    label: "Verificação",
    items: [
      { name: "Selo de verificação", href: "/verification", icon: Shield },
      { name: "Documentos", href: "/verification/documents", icon: FileCheck },
    ],
  },
  {
    label: "Comunidade",
    defaultOpen: false,
    items: [
      { name: "Bolsa de oportunidades", href: "/opportunities", icon: Briefcase },
      { name: "Biblioteca de recursos", href: "/library", icon: BookOpen },
      { name: "Feed", href: "/community/feed", icon: Users },
      { name: "Eventos", href: "/events", icon: CalendarDays },
      { name: "Formação contínua", href: "/training", icon: GraduationCap },
      { name: "Mentorias", href: "/mentorship", icon: UserPlus },
      { name: "Fórum", href: "/community/forum", icon: MessageSquare },
      { name: "Apoio jurídico e ético", href: "/library/legal", icon: Scale },
      { name: "Benefícios e parcerias", href: "/benefits", icon: Gift },
      { name: "Suporte e ouvidoria", href: "/support", icon: HelpCircle },
    ],
  },
  { name: "Configurações", href: "/settings", icon: Settings },
];
