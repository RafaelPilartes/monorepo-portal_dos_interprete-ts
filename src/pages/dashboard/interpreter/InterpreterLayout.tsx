import { DashboardLayout, NavItem, NavGroup } from "@/components/layout/DashboardLayout";
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

const navigation: (NavItem | NavGroup)[] = [
  { name: "Dashboard", href: "/dashboard/interpreter", icon: LayoutDashboard },
  {
    label: "Solicitações",
    defaultOpen: true,
    items: [
      { name: "Minhas Solicitações", href: "/dashboard/interpreter/requests", icon: FileText },
      { name: "Abertas", href: "/dashboard/interpreter/open-requests", icon: Users },
    ],
  },
  {
    label: "Agenda",
    items: [
      { name: "Calendário", href: "/dashboard/interpreter/schedule", icon: Calendar },
      { name: "Disponibilidade", href: "/dashboard/interpreter/availability", icon: Clock },
    ],
  },
  {
    label: "Perfil Público",
    items: [
      { name: "Visão Geral", href: "/dashboard/interpreter/profile/overview", icon: Eye },
      { name: "Experiência", href: "/dashboard/interpreter/profile/experience", icon: Briefcase },
      { name: "Serviços", href: "/dashboard/interpreter/profile/services", icon: Settings },
      { name: "Conteúdos", href: "/dashboard/interpreter/profile/content", icon: Video },
      { name: "Avaliações", href: "/dashboard/interpreter/profile/reviews", icon: Star },
      { name: "Contacto", href: "/dashboard/interpreter/profile/contact", icon: Phone },
    ],
  },
  { name: "Verificação", href: "/dashboard/interpreter/verification", icon: Shield },
  { name: "Ganhos", href: "/dashboard/interpreter/earnings", icon: DollarSign },
  { name: "Documentos", href: "/dashboard/interpreter/documents", icon: FileCheck },
  {
    label: "Portal dos Intérpretes",
    defaultOpen: false,
    items: [
      { name: "Bolsa de Oportunidades", href: "/dashboard/interpreter/opportunities", icon: Briefcase },
      { name: "Biblioteca de Recursos", href: "/dashboard/interpreter/library", icon: BookOpen },
      { name: "Comunidade", href: "/dashboard/interpreter/community", icon: Users },
      { name: "Eventos", href: "/dashboard/interpreter/events", icon: CalendarDays },
      { name: "Formação Contínua", href: "/dashboard/interpreter/training", icon: GraduationCap },
      { name: "Mentorias", href: "/dashboard/interpreter/mentorship", icon: UserPlus },
      { name: "Fórum", href: "/dashboard/interpreter/forum", icon: MessageSquare },
      { name: "Apoio Jurídico e Ético", href: "/dashboard/interpreter/legal", icon: Scale },
      { name: "Benefícios e Parcerias", href: "/dashboard/interpreter/benefits", icon: Gift },
      { name: "Suporte e Ouvidoria", href: "/dashboard/interpreter/support", icon: HelpCircle },
    ],
  },
  { name: "Configurações", href: "/dashboard/interpreter/settings", icon: Settings },
];

export default function InterpreterLayout() {
  return (
    <DashboardLayout
      navigation={navigation}
      userRole="interprete"
      userName="Maria Santos"
      userEmail="maria.santos@email.com"
    />
  );
}