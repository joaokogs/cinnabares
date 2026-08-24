"use client"

import {
  ChevronLeft,
  ChevronRight,
  Flame,
  LogOut,
  Menu,
  Shield,
  User,
  X,
  Search,
  Swords,
} from "lucide-react"
import NextImage from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type GuildInfo = {
  name: string
  tag: string
  memberCount: number
  isFounder: boolean
}

type UserInfo = {
  name: string
  username: string | null
  image: string | null
  role: string
}

type AppSidebarProps = {
  user: UserInfo
  guild: GuildInfo | null
}

export function AppSidebar({ user, guild }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const prevPathname = useRef(pathname)

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), [])
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

  const displayName = user.username ?? user.name
  const initial = displayName.slice(0, 1).toUpperCase()

  const navItems = [
    { href: "/perfil", label: "Perfil", icon: User },
    { href: guild ? `/guildas/${guild.tag}` : "/guildas", label: "Minha guilda", icon: Shield, disabled: !guild },
    { href: "/guildas", label: "Explorar guildas", icon: Search },
    { href: "/torneios", label: "Torneios", icon: Swords },
    ...(user.role === "admin" ? [{ href: "/torneios/novo", label: "Criar torneio", icon: Swords }] : []),
  ]
  const activeNavItem = navItems
    .filter((item) => pathname === item.href || (item.href !== "/guildas" && pathname.startsWith(item.href + "/")))
    .sort((first, second) => second.href.length - first.href.length)[0]

  const sidebarWidth = collapsed ? "w-[68px]" : "w-60"

  const sidebarContent = (
    <nav
      aria-label="Navegação principal"
      className="flex flex-1 flex-col"
    >
      <ul className="flex flex-1 flex-col gap-1 px-3 mt-4" role="list">
        {navItems.map((item) => {
          const isActive = activeNavItem?.href === item.href
          const Icon = item.icon
          return (
            <li key={item.href}>
              {item.disabled ? (
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium opacity-40 cursor-not-allowed",
                    collapsed && "justify-center px-0"
                  )}
                  title={item.label}
                  aria-disabled="true"
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-accent/15 text-accent"
                      : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-auto border-t border-border/60 px-3 py-3">
        {guild && !collapsed && (
          <div className="mb-3 rounded-lg bg-accent/5 border border-accent/10 px-3 py-2">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-accent" aria-hidden="true" />
              <span className="truncate text-xs font-medium text-accent">{guild.name}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{guild.memberCount} membros</p>
          </div>
        )}

        <Link
          href="/perfil"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/5",
            collapsed && "justify-center px-0"
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

        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
          aria-label="Sair da conta"
        >
          <LogOut className="size-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </nav>
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
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-heading text-lg font-semibold tracking-tight"
            aria-label="Cinnabares - ir para o início"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
              <Flame className="size-4" aria-hidden="true" />
            </span>
            Cinnabares
          </Link>
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
          sidebarWidth
        )}
      >
        <div className={cn("flex items-center gap-2 px-4 py-4", collapsed && "justify-center px-0")}>
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-heading text-lg font-semibold tracking-tight"
            aria-label="Cinnabares - ir para o início"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
              <Flame className="size-4" aria-hidden="true" />
            </span>
            {!collapsed && <span>Cinnabares</span>}
          </Link>
        </div>
        {sidebarContent}

        <div className="border-t border-border/60 px-3 py-2">
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/5 hover:text-foreground"
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronLeft className="size-4" aria-hidden="true" />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
