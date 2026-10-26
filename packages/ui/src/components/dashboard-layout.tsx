import { useState, type MouseEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AUTH_TEXTS } from '@portal-dos-interpretes/i18n'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '../lib/utils'
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
import { Menu, X, LogOut, User, Settings, ChevronDown } from 'lucide-react'
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
  /** Signed URL of the profile photo, when there is one. */
  avatarUrl?: string | undefined
  /** In-app route of "Meu Perfil"; the item is hidden when the app has none (AD-014). */
  profileHref?: string
  /** In-app route of "Configurações"; the item is hidden when the app has none (AD-014). */
  settingsHref?: string
  /** Ends the session; "Sair" then leads to the public site. Without it, "Sair" is only a link. */
  onSignOut?: () => Promise<void>
  /** The left side of the top bar: role switch, organisation context (accounts-and-organizations.md). */
  headerStart?: ReactNode
}

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'items' in item
}

const APP_LABELS = { requester: 'Área do solicitante', interpreter: 'Área do intérprete', admin: 'Painel da equipa' }

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '')).toUpperCase() || '?'
}

/** True when the path is the item's page or a page under it ("/requests/12" under "/requests"). */
function isUnder(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardLayout({
  navigation,
  userRole,
  userName = 'Utilizador',
  userEmail,
  avatarUrl,
  profileHref,
  settingsHref,
  onSignOut,
  headerStart,
}: DashboardLayoutProps) {
  // "Sair" and the logo lead to the public site, as before (it is now another app).
  const siteHome = appUrl('site')
  // "Sair" ends the session first; a failure is said, never hidden behind the redirect.
  const signOut = async (event: MouseEvent) => {
    if (!onSignOut) return
    event.preventDefault()
    try {
      await onSignOut()
      window.location.assign(siteHome)
    } catch (error) {
      console.error('[layout] sign-out failed', error)
      toast.error(AUTH_TEXTS.signOutFailed)
    }
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const location = useLocation()

  // The most specific item wins, so "/requests/new" does not also light up "/requests".
  const allItems = navigation.flatMap((entry) => (isNavGroup(entry) ? entry.items : [entry]))
  const activeHref = allItems
    .filter((item) => isUnder(location.pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  const isGroupOpen = (group: NavGroup) => {
    const chosen = openGroups[group.label]
    if (chosen !== undefined) return chosen
    return group.defaultOpen === true || group.items.some((item) => item.href === activeHref)
  }

  const renderNavItem = (item: NavItem) => {
    const isActive = item.href === activeHref
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.name}</span>
      </Link>
    )
  }

  const renderNavGroup = (group: NavGroup) => {
    const isOpen = isGroupOpen(group)
    return (
      <Collapsible
        key={group.label}
        open={isOpen}
        onOpenChange={(open) => setOpenGroups((current) => ({ ...current, [group.label]: open }))}
        className="pt-3"
      >
        <CollapsibleTrigger className="group flex h-7 w-full items-center justify-between rounded-md px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span>{group.label}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-150', !isOpen && '-rotate-90')} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-0.5 space-y-0.5">
          {group.items.map(renderNavItem)}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        aria-label="Navegação"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card transition-transform duration-200 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
            <a href={siteHome} className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <img src={logo} alt="Portal dos Intérpretes" className="h-8 w-auto shrink-0" />
            </a>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar a navegação"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="px-5 pb-1 pt-4 text-xs font-medium text-muted-foreground">{APP_LABELS[userRole]}</p>

          <ScrollArea className="flex-1">
            <nav className="space-y-0.5 px-2.5 pb-6">
              {navigation.map((item) => (isNavGroup(item) ? renderNavGroup(item) : renderNavItem(item)))}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir a navegação"
            className="-ml-1 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">{headerStart}</div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-7 w-7">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">{initials(userName)}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[12rem] truncate font-medium sm:inline">{userName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">{userName}</p>
                {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
              </DropdownMenuLabel>
              {(profileHref || settingsHref) && <DropdownMenuSeparator />}
              {profileHref && (
                <DropdownMenuItem asChild><Link to={profileHref}><User className="mr-2 h-4 w-4" />Meu perfil</Link></DropdownMenuItem>
              )}
              {settingsHref && (
                <DropdownMenuItem asChild><Link to={settingsHref}><Settings className="mr-2 h-4 w-4" />Configurações</Link></DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={siteHome} onClick={signOut} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sair</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}

