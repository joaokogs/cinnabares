"use client"

import {
  Bookmark,
  Bell,
  Flame,
  Home,
  LogIn,
  LogOut,
  Menu,
  Shield,
  User,
  Users,
  X,
  Swords,
  Trophy,
} from "lucide-react"
import NextImage from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { useLoginGate } from "@/components/shared/login-gate"
import { cn } from "@/lib/utils"

type GuildInfo = {
  id: string
  name: string
  tag: string
  memberCount: number
  image: string | null
}

type UserInfo = {
  name: string
  username: string | null
  image: string | null
}

type AppSidebarProps = {
  user: UserInfo | null
  guild: GuildInfo | null
  notificationCount: number
}

type NavItem = {
  href: string
  label: string
  icon: typeof User
}

const NAV_ITEMS: NavItem[] = [
  { href: "/posts", label: "Posts", icon: Home },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/players", label: "Players", icon: Users },
  { href: "/guildas", label: "Guildas", icon: Shield },
  { href: "/torneios", label: "Torneios", icon: Swords },
  { href: "/rankings", label: "Rankings", icon: Trophy },
]

function BrandLink({ showLabel }: { showLabel: boolean }) {
  return (
    <Link
      href="/posts"
      className="flex min-w-0 items-center gap-2 font-heading text-lg font-semibold tracking-tight"
      aria-label="Cinnabares - ir para o início"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
        <Flame className="size-4" aria-hidden="true" />
      </span>
      {showLabel && <span>Cinnabares</span>}
    </Link>
  )
}

function NavItemLink({ item, isActive, collapsed, notificationCount }: { item: NavItem; isActive: boolean; collapsed: boolean; notificationCount: number }) {
  const { isAuthenticated, openLogin } = useLoginGate()
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={(event) => {
        if (!isAuthenticated && item.href !== "/posts") {
          event.preventDefault()
          openLogin(item.href)
        }
      }}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-accent/15 text-accent"
          : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
      title={item.label}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="flex min-w-0 flex-1 items-center justify-between gap-2"><span>{item.label}</span>{item.href === "/notificacoes" && notificationCount > 0 ? <span className="min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-accent-foreground">{notificationCount > 99 ? "99+" : notificationCount}</span> : null}</span>}
      {collapsed && item.href === "/notificacoes" && notificationCount > 0 ? <span className="absolute right-1 top-1 size-2 rounded-full bg-accent ring-2 ring-background" aria-label={`${notificationCount} notificações não lidas`} /> : null}
    </Link>
  )
}

function GuildCard({ guild }: { guild: GuildInfo }) {
  return (
    <div className="mb-3 rounded-lg bg-accent/5 border border-accent/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-md bg-accent/15 text-accent">
          {guild.image ? (
            <NextImage
              src={`/api/guilds/${guild.id}/image?path=${encodeURIComponent(guild.image)}`}
              alt=""
              width={20}
              height={20}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            guild.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <span className="truncate text-xs font-medium text-accent">{guild.name}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{guild.memberCount} membros</p>
    </div>
  )
}

function UserLink({ user, displayName, initial, collapsed }: { user: UserInfo | null; displayName: string; initial: string; collapsed: boolean }) {
  const { isAuthenticated, openLogin } = useLoginGate()
  if (!user) {
    return <button type="button" onClick={() => openLogin("/perfil")} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/5 hover:text-foreground", collapsed && "w-10 justify-center px-0")} aria-label="Fazer login"><LogIn className="size-5 shrink-0" aria-hidden="true" />{!collapsed && <span>{isAuthenticated ? "Perfil" : "Fazer login"}</span>}</button>
  }

  return (
    <Link
      href="/perfil"
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-3 py-1 text-sm transition-colors hover:bg-accent/5",
        collapsed && "w-10 justify-center px-0"
      )}
    >
      <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-accent/15 font-heading text-xs font-semibold text-accent">
        {user.image ? (
          <NextImage
            src={`/api/profile/avatar?path=${encodeURIComponent(user.image)}`}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">@{displayName}</p>
        </div>
      )}
    </Link>
  )
}

function SignOutButton({ collapsed, onSignOut }: { collapsed: boolean; onSignOut: () => void }) {
  const { isAuthenticated, openLogin } = useLoginGate()
  return (
    <button
      type="button"
      onClick={() => isAuthenticated ? onSignOut() : openLogin()}
      className={cn(
        "mt-2 flex h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
        collapsed && "justify-center px-0"
      )}
      aria-label={isAuthenticated ? "Sair da conta" : "Fazer login"}
    >
      {isAuthenticated ? <LogOut className="size-5 shrink-0" aria-hidden="true" /> : <LogIn className="size-5 shrink-0" aria-hidden="true" />}
      {!collapsed && <span>{isAuthenticated ? "Sair" : "Fazer login"}</span>}
    </button>
  )
}

function SavedPostsLink({ collapsed }: { collapsed: boolean }) {
  const { isAuthenticated, openLogin } = useLoginGate()
  return <Link href="/posts/salvos" onClick={(event) => { if (!isAuthenticated) { event.preventDefault(); openLogin("/posts/salvos") } }} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/5 hover:text-foreground", collapsed && "w-10 justify-center px-0")} title="Posts salvos"><Bookmark className="size-5 shrink-0" aria-hidden="true" />{!collapsed && <span>Posts salvos</span>}</Link>
}

type SidebarNavProps = {
  guild: GuildInfo | null
  user: UserInfo | null
  displayName: string
  initial: string
  collapsed: boolean
  activeNavItem: NavItem | undefined
  onSignOut: () => void
  notificationCount: number
}

function SidebarNav({ guild, user, displayName, initial, collapsed, activeNavItem, onSignOut, notificationCount }: SidebarNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="flex flex-1 flex-col"
    >
      <ul className="flex flex-1 flex-col gap-1 px-3 mt-4" role="list">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <NavItemLink item={item} isActive={activeNavItem?.href === item.href} collapsed={collapsed} notificationCount={notificationCount} />
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-border/60 px-3 py-3">
        {guild && !collapsed && <GuildCard guild={guild} />}
        <UserLink user={user} displayName={displayName} initial={initial} collapsed={collapsed} />
        <SavedPostsLink collapsed={collapsed} />
        {user ? <SignOutButton collapsed={collapsed} onSignOut={onSignOut} /> : null}
      </div>
    </nav>
  )
}

export function AppSidebar({ user, guild, notificationCount }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const prevPathname = useRef(pathname)

  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      setMobileOpen(false)
    }
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  const displayName = user?.username ?? user?.name ?? "Fazer login"
  const initial = displayName.slice(0, 1).toUpperCase()

  const activeNavItem = NAV_ITEMS
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    .sort((first, second) => second.href.length - first.href.length)[0]

  const collapsed = true

  const sidebarContent = (
    <SidebarNav
      guild={guild}
      user={user}
      displayName={displayName}
      initial={initial}
      collapsed={collapsed}
      activeNavItem={activeNavItem}
      onSignOut={() => {
        void handleSignOut()
      }}
      notificationCount={notificationCount}
    />
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={openMobile}
        className="fixed left-4 top-4 z-50 grid size-10 place-items-center rounded-lg border border-border/60 bg-background/85 backdrop-blur-md lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/60 bg-background transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <BrandLink showLabel />
          <button
            type="button"
            onClick={closeMobile}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar menu"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-background transition-[width] duration-200 lg:flex",
          "w-[68px]"
        )}
      >
        <div className={cn("flex items-center gap-2 px-4 py-4", collapsed && "justify-center px-0")}>
          <BrandLink showLabel={!collapsed} />
        </div>
        {sidebarContent}

      </aside>
    </>
  )
}
