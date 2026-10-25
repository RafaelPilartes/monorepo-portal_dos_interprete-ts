import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '../lib/utils'
import { Button } from './button'
import { ScrollArea } from './scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible"
import { Menu, X, LogOut, User, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import logo from '../assets/logo.png'
import { appUrl } from '../lib/app-urls'

export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string | undefined }>
}

export interface NavGroup {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

interface DashboardLayoutProps {
  navigation: (NavItem | NavGroup)[]
  userRole: 'requester' | 'interpreter' | 'admin'
  userName?: string
  userEmail?: string
  /** In-app route of "Meu Perfil"; the item is hidden when the app has none (AD-014). */
  profileHref?: string
  /** In-app route of "Configurações"; the item is hidden when the app has none (AD-014). */
  settingsHref?: string
}

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'items' in item
}

export function DashboardLayout({
  navigation,
  userRole,
  userName = 'Utilizador',
  userEmail = 'email@exemplo.com',
  profileHref,
  settingsHref
}: DashboardLayoutProps) {
  // "Sair" and the logo lead to the public site, as before (it is now another app).
  const siteHome = appUrl('site')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const location = useLocation()

  const roleLabels = { requester: 'Solicitante', interpreter: 'Intérprete', admin: 'Administrador' }
  const roleColors = { requester: 'bg-secondary', interpreter: 'bg-primary', admin: 'bg-destructive' }

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isGroupOpen = (group: NavGroup) => {
    if (openGroups[group.label] !== undefined) return openGroups[group.label]
    // Auto-open if any item in group is active
    return group.defaultOpen || group.items.some(item => location.pathname.startsWith(item.href))
  }

  const renderNavItem = (item: NavItem, onClick?: () => void) => {
    const isActive = location.pathname === item.href
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
          isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {item.name}
      </Link>
    )
  }

  const renderNavGroup = (group: NavGroup) => {
    const isOpen = isGroupOpen(group)
    const hasActiveItem = group.items.some(item => location.pathname.startsWith(item.href))

    return (
      <Collapsible key={group.label} open={isOpen} onOpenChange={() => toggleGroup(group.label)}>
        <CollapsibleTrigger className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          hasActiveItem ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}>
          <span>{group.label}</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-3 space-y-1 mt-1">
          {group.items.map(item => renderNavItem(item, () => setSidebarOpen(false)))}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Fixed Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <a href={siteHome} className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <img src={logo} alt="Portal dos Intérpretes" className="h-12 w-auto" />
            </a>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden rounded-md p-1.5 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white', roleColors[userRole])}>
                  {roleLabels[userRole]}
                </span>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {navigation.map(item => {
                if (isNavGroup(item)) {
                  return renderNavGroup(item)
                }
                return renderNavItem(item, () => setSidebarOpen(false))
              })}
            </nav>
          </ScrollArea>

          <div className="border-t border-border p-4">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" asChild>
              <a href={siteHome}><LogOut className="h-5 w-5" />Sair</a>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content with left margin for fixed sidebar */}
      <div className="flex flex-1 flex-col lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden rounded-md p-2 hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block text-sm font-medium">{userName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profileHref && (
                <DropdownMenuItem asChild><Link to={profileHref}><User className="mr-2 h-4 w-4" />Meu Perfil</Link></DropdownMenuItem>
              )}
              {settingsHref && (
                <DropdownMenuItem asChild><Link to={settingsHref}><Settings className="mr-2 h-4 w-4" />Configurações</Link></DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><a href={siteHome} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Sair</a></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="container-wide py-6 lg:py-8"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}