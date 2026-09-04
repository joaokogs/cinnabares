"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { CircleDot, Package, X } from "lucide-react"

import type { VisibleRosterEntry } from "@/lib/tournaments/roster"
import { TIER_LABELS } from "@/lib/tournaments/tiers"

type Visibility = "blind" | "partial" | "total"

export function capitalize(s: string): string {
  return s
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function RosterIcon({ name, kind, className = "size-8" }: { name: string; kind: "pokemon" | "item"; className?: string }) {
  const [src, setSrc] = useState<string | null>(() => kind === "item" ? itemSpriteUrl(name) : pokemonSpriteCache.get(name.trim().toLowerCase()) ?? null)
  const Icon = kind === "pokemon" ? CircleDot : Package

  useEffect(() => {
    if (kind !== "pokemon") return

    const normalizedName = name.trim().toLowerCase()
    const cachedUrl = pokemonSpriteCache.get(normalizedName)
    if (cachedUrl !== undefined) return

    let active = true
    fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(normalizedName)}`)
      .then((response) => response.ok ? response.json() as Promise<{ id: number }> : Promise.reject())
      .then(({ id }) => {
        const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        pokemonSpriteCache.set(normalizedName, url)
        if (active) setSrc(url)
      })
      .catch(() => pokemonSpriteCache.set(normalizedName, null))

    return () => { active = false }
  }, [kind, name])

  if (!src) return <Icon aria-hidden="true" className={`${className} shrink-0 text-muted-foreground`} />

  return <Image src={src} alt="" width={32} height={32} className={`${className} shrink-0 object-contain`} unoptimized />
}

const pokemonSpriteCache = new Map<string, string | null>()

function itemSpriteUrl(name: string) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(name.trim().toLowerCase())}.png`
}

export function ParticipantSidebar({
  name,
  roster,
  visibility,
  children,
}: {
  name: string
  roster: VisibleRosterEntry[]
  visibility: Visibility
  children: React.ReactNode
}) {
  if (visibility === "blind" || !roster.length) {
    return children
  }

  const showItems = visibility === "total"

  return (
    <SidebarTrigger name={name} roster={roster} showItems={showItems}>{children}</SidebarTrigger>
  )
}

const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), textarea, input, select, " + '[tabindex]:not([tabindex="-1"])'

function SidebarTrigger({ name, roster, showItems, children }: { name: string; roster: VisibleRosterEntry[]; showItems: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleClose = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-sm text-left underline decoration-dotted underline-offset-2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`Ver time de ${name}`}
      >
        {children}
      </button>
      {open ? (
        <SidebarState name={name} roster={roster} showItems={showItems} onClose={handleClose} />
      ) : null}
    </>
  )
}

function SidebarState({ name, roster, showItems, onClose }: { name: string; roster: VisibleRosterEntry[]; showItems: boolean; onClose: () => void }) {
  const asideRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
        return
      }

      if (event.key === "Tab" && asideRef.current) {
        const focusable = asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last.focus()
          }
        } else if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    asideRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside ref={asideRef} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl" role="dialog" aria-modal="true" aria-label={`Escalação de ${name}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escalação</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Fechar escalação">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <h2 className="mb-4 text-center font-heading text-lg font-bold">{name}</h2>
          <div className="space-y-5"><SidebarContent roster={roster} showItems={showItems} name={name} /></div>
        </div>
      </aside>
    </>
  )
}

function SidebarContent({ name, roster, showItems }: { name: string; roster: VisibleRosterEntry[]; showItems: boolean }) {
  return roster.map((entry, i) => (
    <section key={`${name}-${i}`} className="border-b border-border/60 pb-4 last:border-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold">{entry.playerName}</p>
        <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {TIER_LABELS[entry.tier] ?? entry.tier}
        </span>
      </div>
      {entry.team && entry.team.length > 0 ? (
        <ul className="space-y-3 pl-2">
          {entry.team.map((pokemon, j) => (
            <li key={`${pokemon.name}-${j}`} className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border/60 bg-background/50 px-3 py-3">
              <div className="flex items-center justify-center">
                <RosterIcon name={pokemon.name} kind="pokemon" className="size-16" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{capitalize(pokemon.name)}</p>
                {showItems && pokemon.item ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RosterIcon name={pokemon.item} kind="item" className="size-5" />
                    <span className="truncate">{capitalize(pokemon.item)}</span>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Sem time definido</p>}
    </section>
  ))
}
