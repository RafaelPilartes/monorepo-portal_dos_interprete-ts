import { useState, useEffect } from 'react'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Label } from '@portal-dos-interpretes/ui/components/label'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@portal-dos-interpretes/ui/components/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@portal-dos-interpretes/ui/components/select'
import { Switch } from '@portal-dos-interpretes/ui/components/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@portal-dos-interpretes/ui/components/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@portal-dos-interpretes/ui/components/command'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'

import { AdminProfileEntity } from '@/core/entities/identity/AdminProfileEntity'
import { AdminPermissionLevel, UserRole } from '@/type/enum'
import { useUserViewModel } from '@/viewModels/user.viewmodel'
import { cn } from '@portal-dos-interpretes/ui/lib/utils'

export type AdminProfilePayload = Omit<
  AdminProfileEntity,
  'id' | 'created_at' | 'updated_at' | 'user'
>

interface TeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: AdminProfilePayload) => void
  member?: AdminProfileEntity | null
  isLoading?: boolean
}

export function TeamMemberModal({
  isOpen,
  onClose,
  onSave,
  member,
  isLoading
}: TeamMemberModalProps) {
  const [formData, setFormData] = useState<AdminProfilePayload>({
    user_id: '',
    permission_level: AdminPermissionLevel.MODERATOR,
    department: '',
    is_active: true
  })

  // Popover state for searchable select
  const [openCombobox, setOpenCombobox] = useState(false)
  const [searchUser, setSearchUser] = useState('')

  // Real data (server-side pagination and searchTerm)
  const { getAllUsers } = useUserViewModel()
  const { data: usersResponse, isLoading: isLoadingUsers } = getAllUsers(
    undefined,
    0,
    searchUser || undefined,
    { role: UserRole.ADMIN }
  )
  const users = usersResponse?.data || []

  useEffect(() => {
    if (member) {
      setFormData({
        user_id: member.user_id,
        permission_level: member.permission_level,
        department: member.department || '',
        is_active: member.is_active,
        last_login_at: member.last_login_at
      })
    } else {
      setFormData({
        user_id: '',
        permission_level: AdminPermissionLevel.MODERATOR,
        department: '',
        is_active: true
      })
    }
  }, [member, isOpen])

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchUser('')
      setOpenCombobox(false)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  // Find selected user to display their name properly
  const selectedUser = member
    ? { name: member.user?.name, email: member.user?.email, id: member.user_id }
    : users.find(u => u.id === formData.user_id)

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Editar Membro da Equipa' : 'Adicionar Novo Membro'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="user">Utilizador</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="justify-between w-full font-normal"
                  disabled={!!member}
                >
                  {isLoadingUsers && !users.length ? (
                    <span className="flex items-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                      Carregando utilizadores...
                    </span>
                  ) : formData.user_id ? (
                    selectedUser?.name ? (
                      `${selectedUser.name} (${selectedUser.email})`
                    ) : (
                      formData.user_id
                    )
                  ) : (
                    'Selecione um utilizador...'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Pesquisar utilizador por nome ou e-mail..."
                    value={searchUser}
                    onValueChange={setSearchUser}
                  />
                  <CommandList>
                    {isLoadingUsers && (
                      <div className="p-4 text-sm text-center text-muted-foreground flex justify-center items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                        Pesquisando...
                      </div>
                    )}
                    {!isLoadingUsers && users.length === 0 && (
                      <CommandEmpty>Nenhum utilizador encontrado.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {users.map(user => (
                        <CommandItem
                          key={user.id}
                          value={user.id}
                          onSelect={() => {
                            setFormData({ ...formData, user_id: user.id })
                            setOpenCombobox(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.user_id === user.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {user.name} ({user.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Cargo / Permissões</Label>
            <Select
              value={formData.permission_level}
              onValueChange={value =>
                setFormData({
                  ...formData,
                  permission_level: value as AdminPermissionLevel
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AdminPermissionLevel.SUPER_ADMIN}>
                  Super Admin
                </SelectItem>
                <SelectItem value={AdminPermissionLevel.FINANCE}>
                  Gestor Financeiro
                </SelectItem>
                <SelectItem value={AdminPermissionLevel.MODERATOR}>
                  Moderador
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento (Opcional)</Label>
            <Input
              id="department"
              placeholder="Ex: TI, Finanças, Suporte"
              value={formData.department || ''}
              onChange={e =>
                setFormData({ ...formData, department: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Acesso Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que este utilizador aceda ao painel
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={checked =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.user_id}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {member ? 'Guardar Alterações' : 'Adicionar Membro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
