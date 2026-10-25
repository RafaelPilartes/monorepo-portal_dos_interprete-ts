import { AdminRole } from '@/components/dashboard/modals/TeamMemberModal'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: AdminRole
  isActive: boolean
  lastLogin: string
}

export const mockTeam: TeamMember[] = [
  {
    id: '1',
    name: 'Rafael Pilartes',
    email: 'rafael.pilartes@gracemind.com',
    role: 'super_admin',
    isActive: true,
    lastLogin: 'Há 2 horas'
  },
  {
    id: '2',
    name: 'Ana Beatriz',
    email: 'ana.beatriz@gracemind.com',
    role: 'financial',
    isActive: true,
    lastLogin: 'Há 1 dia'
  },
  {
    id: '3',
    name: 'Carlos Manuel',
    email: 'carlos.manuel@gracemind.com',
    role: 'support',
    isActive: true,
    lastLogin: 'Há 5 horas'
  },
  {
    id: '4',
    name: 'Sara Lima',
    email: 'sara.lima@gracemind.com',
    role: 'moderator',
    isActive: false,
    lastLogin: '15 Fev 2026'
  }
]
