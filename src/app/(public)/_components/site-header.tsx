"use client"

import { useState } from "react"
import { ChevronDown, Flame } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "#inicio", label: "Início" },
  { href: "#eventos", label: "Eventos" },
]

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-lg font-heading text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Cinnabares — voltar ao topo"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
            <Flame className="size-4" aria-hidden="true" />
          </span>
          Cinnabares
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="ml-auto flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-2 text-sm text-muted-foreground md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          Menu
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              menuOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Navegação mobile"
            className="absolute top-12 right-0 z-20 flex min-w-40 flex-col gap-1 rounded-xl border border-border bg-background p-2 shadow-xl md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <Button asChild size="sm" className="hidden md:inline-flex">
          <Link href="#eventos">Ver eventos</Link>
        </Button>
      </div>
    </header>
  )
}
