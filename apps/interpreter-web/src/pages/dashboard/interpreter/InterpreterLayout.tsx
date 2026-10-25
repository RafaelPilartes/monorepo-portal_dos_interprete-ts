import { DashboardLayout, NavItem, NavGroup } from "@portal-dos-interpretes/ui/components/dashboard-layout";
import {
  LayoutDashboard,
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
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Solicitações",
    defaultOpen: true,
    items: [
      { name: "Minhas Solicitações", href: "/requests", icon: FileText },
      { name: "Abertas", href: "/open-requests", icon: Users },
    ],
  },
  {
    label: "Agenda",
    items: [
      { name: "Calendário", href: "/schedule", icon: Calendar },
      { name: "Disponibilidade", href: "/availability", icon: Clock },
    ],
  },
  {
    label: "Perfil Público",
    items: [
      { name: "Visão Geral", href: "/profile/overview", icon: Eye },
      { name: "Experiência", href: "/profile/experience", icon: Briefcase },
      { name: "Serviços", href: "/profile/services", icon: Settings },
      { name: "Conteúdos", href: "/profile/content", icon: Video },
      { name: "Avaliações", href: "/profile/reviews", icon: Star },
      { name: "Contacto", href: "/profile/contact", icon: Phone },
    ],
  },
  { name: "Verificação", href: "/verification", icon: Shield },
  { name: "Ganhos", href: "/earnings", icon: DollarSign },
  { name: "Documentos", href: "/verification/documents", icon: FileCheck },
  {
    label: "Portal dos Intérpretes",
    defaultOpen: false,
    items: [
      { name: "Bolsa de Oportunidades", href: "/opportunities", icon: Briefcase },
      { name: "Biblioteca de Recursos", href: "/library", icon: BookOpen },
      { name: "Comunidade", href: "/community/feed", icon: Users },
      { name: "Eventos", href: "/events", icon: CalendarDays },
      { name: "Formação Contínua", href: "/training", icon: GraduationCap },
      { name: "Mentorias", href: "/mentorship", icon: UserPlus },
      { name: "Fórum", href: "/community/forum", icon: MessageSquare },
      { name: "Apoio Jurídico e Ético", href: "/library/legal", icon: Scale },
      { name: "Benefícios e Parcerias", href: "/benefits", icon: Gift },
      { name: "Suporte e Ouvidoria", href: "/support", icon: HelpCircle },
    ],
  },
  { name: "Configurações", href: "/settings", icon: Settings },
];

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