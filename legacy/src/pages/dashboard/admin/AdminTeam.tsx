import { useState } from 'react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FiltersBar } from '@/components/dashboard/FiltersBar'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, Edit2, Key, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  TeamMemberModal,
  AdminProfilePayload
} from '@/components/dashboard/modals/TeamMemberModal'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { useAdminProfileViewModel } from '@/viewModels/admin-profile.viewmodel'
import { useUserViewModel } from '@/viewModels/user.viewmodel'
import { AdminProfileEntity } from '@/core/entities/identity/AdminProfileEntity'
import { AdminPermissionLevel, UserRole } from '@/type/enum'

const roleFilters = [
  { value: 'all', label: 'Todos os Cargos' },
  { value: AdminPermissionLevel.SUPER_ADMIN, label: 'Super Admin' },
  { value: AdminPermissionLevel.FINANCE, label: 'Gestor Financeiro' },
  { value: AdminPermissionLevel.MODERATOR, label: 'Moderador' }
]

export default function AdminTeam() {
  const {
    getAllAdminProfiles,
    createAdminProfile,
    updateAdminProfile,
    isCreating,
    isUpdating
  } = useAdminProfileViewModel()

  const { updateUser } = useUserViewModel()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const [selectedMember, setSelectedMember] =
    useState<AdminProfileEntity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const offset = (currentPage - 1) * itemsPerPage

  // Create object mapping for backend filtering
  const filters: Partial<AdminProfileEntity> =
    roleFilter !== 'all'
      ? { permission_level: roleFilter as AdminPermissionLevel }
      : {}

  // Consumindo proper endpoint arguments
  const { data: adminsResponse, isLoading } = getAllAdminProfiles(
    itemsPerPage,
    offset,
    search || undefined,
    Object.keys(filters).length ? filters : undefined
  )

  const admins = adminsResponse?.data || []

  // Se paginationType tem 'total' ou 'count', utilizamos no math (segundo a IApiResponse)
  const totalItems =
    adminsResponse?.pagination?.total ?? adminsResponse?.pagination?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const handleAddMember = () => {
    setSelectedMember(null)
    setIsModalOpen(true)
  }

  const handleEditMember = (member: AdminProfileEntity) => {
    setSelectedMember(member)
    setIsModalOpen(true)
  }

  const handleSaveMember = async (memberData: AdminProfilePayload) => {
    try {
      if (selectedMember) {
        // Edit
        await updateAdminProfile({
          id: selectedMember.id,
          data: {
            permission_level: memberData.permission_level,
            department: memberData.department,
            is_active: memberData.is_active
          }
        })
      } else {
        // Add
        // Aqui o memberData já possui o user_id selecionado no Select do Modal.
        // 1. Criamos o perfil de acesso Admin
        await createAdminProfile({
          user_id: memberData.user_id,
          permission_level: memberData.permission_level,
          department: memberData.department,
          is_active: memberData.is_active
        })

        // 2. Atualizamos o role global do User para ADMIN conforme pedido
        await updateUser({
          id: memberData.user_id,
          data: { role: UserRole.ADMIN }
        })
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleToggleStatus = async (member: AdminProfileEntity) => {
    try {
      await updateAdminProfile({
        id: member.id,
        data: {
          is_active: !member.is_active
        }
      })
      toast.success(
        `Acesso de ${member.user?.name || 'Administrador'} ${!member.is_active ? 'ativado' : 'desativado'}.`
      )
    } catch (error) {
      console.error(error)
      toast.error('Erro ao alternar estado do administrador.')
    }
  }

  const getRoleBadge = (role: AdminPermissionLevel) => {
    switch (role) {
      case AdminPermissionLevel.SUPER_ADMIN:
        return (
          <Badge variant="destructive" className="bg-red-600">
            Super Admin
          </Badge>
        )
      case AdminPermissionLevel.FINANCE:
        return <Badge variant="secondary">Gestor Financeiro</Badge>
      case AdminPermissionLevel.MODERATOR:
        return (
          <Badge
            variant="outline"
            className="border-orange-500 text-orange-500"
          >
            Moderador
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Equipa"
        description="Gira os acessos e permissões dos administradores da plataforma"
        action={
          <Button onClick={handleAddMember}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Membro
          </Button>
        }
      />

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Pesquisar por nome ou email..."
        filters={[
          {
            name: 'role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: roleFilters
          }
        ]}
        onClearFilters={() => {
          setSearch('')
          setRoleFilter('all')
          setCurrentPage(1)
        }}
        hasActiveFilters={search !== '' || roleFilter !== 'all'}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : admins.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum membro encontrado"
          description="Não existem administradores que correspondam aos filtros."
        />
      ) : (
        <div className="grid gap-4">
          {admins.map(member => {
            const name = member.user?.name || 'Administrador'
            const email = member.user?.email || 'Sem email'
            const is_active = member.is_active
            const role = member.permission_level
            const lastLogin = member.last_login_at
              ? new Date(member.last_login_at).toLocaleDateString('pt-PT')
              : 'Nunca'

            return (
              <Card key={member.id} className={!is_active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border bg-muted">
                        <AvatarFallback className="text-lg">
                          {name
                            .split(' ')
                            .map(n => n[0] || '')
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{name}</h3>
                          {getRoleBadge(role)}
                          {!is_active && (
                            <Badge
                              variant="secondary"
                              className="bg-gray-200 text-gray-700"
                            >
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Key className="h-3 w-3" /> Último acesso:{' '}
                            {lastLogin}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button
                        variant={is_active ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleToggleStatus(member)}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        {is_active ? 'Desativar Acesso' : 'Ativar Acesso'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(p => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
        member={selectedMember}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}
