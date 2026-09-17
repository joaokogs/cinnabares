"use client"

import Image from "next/image"
import { createPortal } from "react-dom"
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react"

import { TypeIcon } from "@/components/ui/pokemon-type-icon"
import { getHiddenPowerType, type NamedOption, type PokeOption } from "@/hooks/use-pokeapi-data"
import { cn } from "@/lib/utils"

export type MentionKind = "pokemon" | "item" | "move" | "nature" | "ability"

export type MentionOption = {
  name: string
  kind: MentionKind
  iconUrl?: string
}

type MentionSourceOptions = {
  pokemon: PokeOption[]
  items: PokeOption[]
  abilities: NamedOption[]
  natures: NamedOption[]
  moves: NamedOption[]
}

type MentionDetails = {
  title: string
  subtitle?: string
  lines: string[]
  type?: string
  natureStats?: {
    increased: string | null
    decreased: string | null
  }
}

type ApiResource = {
  name?: string
  types?: { type: { name: string } }[]
  abilities?: { ability: { name: string } }[]
  stats?: { base_stat: number; stat: { name: string } }[]
  type?: { name: string }
  damage_class?: { name: string }
  power?: number | null
  accuracy?: number | null
  increased_stat?: { name: string } | null
  decreased_stat?: { name: string } | null
  effect_entries?: { effect: string; language: { name: string } }[]
}

const detailsCache = new Map<string, MentionDetails>()

function titleCase(value: string) {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function getEffect(data: ApiResource) {
  return data.effect_entries?.find((entry) => entry.language.name === "en")?.effect?.replace(/\$\{[^}]+\}/g, "")
}

export function getMentionOptions(options: MentionSourceOptions): MentionOption[] {
  const values: MentionOption[] = [
    ...options.pokemon.map((option) => ({ ...option, kind: "pokemon" as const })),
    ...options.items.map((option) => ({ ...option, kind: "item" as const })),
    ...options.moves.map((option) => ({ ...option, kind: "move" as const })),
    ...options.natures.map((option) => ({ ...option, kind: "nature" as const })),
    ...options.abilities.map((option) => ({ ...option, kind: "ability" as const })),
  ]
  return Array.from(new Map(values.map((option) => [`${option.kind}:${option.name}`, option])).values())
}

function MentionHoverCard({ option }: { option: MentionOption }) {
  const cacheKey = `${option.kind}:${option.name}`
  const [details, setDetails] = useState<MentionDetails | null>(() => detailsCache.get(cacheKey) ?? null)
  useEffect(() => {
    if (detailsCache.has(cacheKey)) return
    let active = true
    fetch(`https://pokeapi.co/api/v2/${option.kind}/${encodeURIComponent(option.name)}`)
      .then((response) => response.json() as Promise<ApiResource>)
      // eslint-disable-next-line complexity
      .then((data) => {
        const typeNames = data.types?.map(({ type }) => titleCase(type.name)).join(" / ")
        const lines = option.kind === "pokemon"
          ? [`Tipos: ${typeNames || "Não informado"}`, `Abilities: ${data.abilities?.map(({ ability }) => titleCase(ability.name)).join(", ") || "Não informado"}`]
          : option.kind === "move"
            ? [`Categoria: ${titleCase(data.damage_class?.name ?? "Não informado")}`, `Poder: ${data.power ?? "—"} · Precisão: ${data.accuracy ?? "—"}`, getEffect(data) || "Detalhes não informados."]
            : option.kind === "nature"
              ? [`Aumenta: ${titleCase(data.increased_stat?.name ?? "nenhum")}`, `Reduz: ${titleCase(data.decreased_stat?.name ?? "nenhum")}`]
              : [getEffect(data) || "Descrição não informada."]
        const nextDetails = {
          title: titleCase(data.name ?? option.name),
          subtitle: typeNames,
          lines,
          type: data.type?.name,
          natureStats: option.kind === "nature"
            ? { increased: data.increased_stat?.name ?? null, decreased: data.decreased_stat?.name ?? null }
            : undefined,
        }
        detailsCache.set(cacheKey, nextDetails)
        if (active) setDetails(nextDetails)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [cacheKey, option.kind, option.name])

  const hiddenPowerType = getHiddenPowerType(option.name)
  return <span className="group/mention relative inline-flex cursor-help font-semibold text-accent underline decoration-accent/40 underline-offset-2"><span>@{titleCase(option.name)}</span><span className="pointer-events-none invisible absolute bottom-full left-0 z-50 mb-2 w-64 translate-y-1 rounded-lg border border-accent/30 bg-popover p-3 text-left opacity-0 shadow-xl transition-all group-hover/mention:visible group-hover/mention:translate-y-0 group-hover/mention:opacity-100"><span className="mb-1 flex items-center gap-2 font-heading text-xs font-bold text-popover-foreground">{option.iconUrl ? <Image src={option.iconUrl} alt="" width={24} height={24} unoptimized className="size-6 object-contain" /> : details?.type || hiddenPowerType ? <TypeIcon type={details?.type ?? hiddenPowerType ?? "normal"} size={16} /> : null}{details?.title ?? titleCase(option.name)}</span>{details?.subtitle ? <span className="block text-[10px] font-semibold text-accent">{details.subtitle}</span> : null}{details?.natureStats ? <span className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-bold">{details.natureStats.increased ? <span className="text-emerald-500">↑ {titleCase(details.natureStats.increased)}</span> : null}{details.natureStats.decreased ? <span className="text-red-400">↓ {titleCase(details.natureStats.decreased)}</span> : null}{!details.natureStats.increased && !details.natureStats.decreased ? <span className="text-muted-foreground">Nature neutra</span> : null}</span> : <span className="mt-1.5 block space-y-1 text-[10px] leading-4 text-muted-foreground">{details ? details.lines.map((line) => <span key={line} className="block">{line}</span>) : <span className="block">Carregando dados...</span>}</span>}</span></span>
}

type MoveHoverDetails = {
  name: string
  type: string
  category: string
  power: number | null
  accuracy: number | null
  effect: string
}

const moveHoverCache = new Map<string, MoveHoverDetails>()

type MoveHoverPosition = {
  left: number
  top: number
  above: boolean
}

export function MoveHoverCard({ name, children, className }: { name: string; children?: ReactNode; className?: string }) {
  const [details, setDetails] = useState<MoveHoverDetails | null>(() => moveHoverCache.get(name) ?? null)
  const [hovered, setHovered] = useState(false)
  const [position, setPosition] = useState<MoveHoverPosition | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!name || moveHoverCache.has(name)) return
    let active = true
    fetch(`https://pokeapi.co/api/v2/move/${encodeURIComponent(name)}`)
      .then((response) => response.json() as Promise<ApiResource>)
      .then((data) => {
        const nextDetails = {
          name: data.name ?? name,
          type: data.type?.name ?? "normal",
          category: data.damage_class?.name ?? "status",
          power: data.power ?? null,
          accuracy: data.accuracy ?? null,
          effect: getEffect(data) || "Detalhes não informados.",
        }
        moveHoverCache.set(name, nextDetails)
        if (active) setDetails(nextDetails)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [name])

  useLayoutEffect(() => {
    if (!hovered) return

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const above = rect.top > 180
      const maxLeft = Math.max(8, window.innerWidth - 272)
      setPosition({
        left: Math.min(Math.max(8, rect.left), maxLeft),
        top: above ? rect.top - 8 : rect.bottom + 8,
        above,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [hovered])

  const hiddenPowerType = getHiddenPowerType(name)
  const hoverCard = hovered && position && typeof document !== "undefined"
    ? createPortal(
        <span
          className="pointer-events-none fixed z-[100] w-64 rounded-lg border border-accent/30 bg-popover p-3 text-left shadow-xl"
          style={{
            left: position.left,
            top: position.top,
            maxWidth: "calc(100vw - 16px)",
            transform: position.above ? "translateY(-100%)" : undefined,
          }}
        >
          <span className="mb-1 flex items-center gap-2 font-heading text-xs font-bold text-popover-foreground">
            <TypeIcon type={hiddenPowerType ?? details?.type ?? "normal"} size={16} />
            {titleCase(details?.name ?? name)}
          </span>
          {details ? (
            <span className="mt-1.5 block space-y-1 text-[10px] leading-4 text-muted-foreground">
              <span className="block font-semibold text-accent">{titleCase(details.category)}</span>
              <span className="block">Poder: {details.power ?? "—"} · Precisão: {details.accuracy ?? "—"}</span>
              <span className="block">{details.effect}</span>
            </span>
          ) : (
            <span className="mt-1.5 block text-[10px] leading-4 text-muted-foreground">Carregando dados...</span>
          )}
        </span>,
        document.body,
      )
    : null

  return <><span ref={triggerRef} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={cn("relative inline-flex cursor-help", className)}>{children ?? titleCase(details?.name ?? name)}</span>{hoverCard}</>
}

export function RichMentionText({ text, options }: { text: string; options: MentionOption[] }) {
  const byName = useMemo(() => new Map(options.map((option) => [option.name.toLowerCase(), option])), [options])
  const parts = text.split(/(@[a-z0-9]+(?:-[a-z0-9]+)*)/gi)
  return <>{parts.map((part, index) => { const option = part.startsWith("@") ? byName.get(part.slice(1).toLowerCase()) : undefined; return option ? <MentionHoverCard key={`${part}-${index}`} option={option} /> : <Fragment key={`${part}-${index}`}>{part}</Fragment> })}</>
}

export function MentionTextarea({ value, onChange, options, placeholder, rows = 4, maxLength, required = false, className }: { value: string; onChange: (value: string) => void; options: MentionOption[]; placeholder?: string; rows?: number; maxLength?: number; required?: boolean; className?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mention, setMention] = useState<{ start: number; end: number; query: string } | null>(null)
  const [dropUp, setDropUp] = useState(false)
  const filtered = useMemo(() => {
    if (!mention) return []
    const query = mention.query.toLowerCase()
    return options.filter((option) => option.name.toLowerCase().includes(query)).slice(0, 8)
  }, [mention, options])

  useLayoutEffect(() => {
    if (!mention || filtered.length === 0 || !textareaRef.current) {
      setDropUp(false)
      return
    }

    const updatePlacement = () => {
      const rect = textareaRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setDropUp(spaceBelow < 280 && spaceAbove > spaceBelow)
    }

    updatePlacement()
    window.addEventListener("resize", updatePlacement)
    window.addEventListener("scroll", updatePlacement, true)
    return () => {
      window.removeEventListener("resize", updatePlacement)
      window.removeEventListener("scroll", updatePlacement, true)
    }
  }, [filtered.length, mention])

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value
    const cursor = event.target.selectionStart
    onChange(nextValue)
    const match = nextValue.slice(0, cursor).match(/@([a-z0-9-]*)$/i)
    setMention(match ? { start: cursor - match[0].length, end: cursor, query: match[1] } : null)
  }

  function selectMention(option: MentionOption) {
    if (!mention) return
    const token = `@${option.name} `
    const nextValue = `${value.slice(0, mention.start)}${token}${value.slice(mention.end)}`
    const cursor = mention.start + token.length
    onChange(nextValue)
    setMention(null)
    requestAnimationFrame(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(cursor, cursor) })
  }

  return <div className="relative"><textarea ref={textareaRef} value={value} onChange={handleChange} onKeyDown={(event) => { if (event.key === "Escape") setMention(null) }} placeholder={placeholder} rows={rows} maxLength={maxLength} required={required} className={cn("w-full resize-y border border-input bg-background/70 px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30", className)} />{mention && filtered.length > 0 ? <div className={cn("absolute left-0 right-0 z-40 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl", dropUp ? "bottom-full mb-1" : "top-full mt-1")}>{filtered.map((option) => { const hiddenPowerType = getHiddenPowerType(option.name); return <button key={`${option.kind}:${option.name}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectMention(option)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs hover:bg-muted"><span className="w-16 shrink-0 font-mono text-[9px] uppercase text-accent">{option.kind}</span>{hiddenPowerType ? <TypeIcon type={hiddenPowerType} size={16} /> : option.iconUrl ? <Image src={option.iconUrl} alt="" width={22} height={22} unoptimized className="size-5 object-contain" /> : null}<span className="font-semibold">{titleCase(option.name)}</span></button> })}</div> : null}</div>
}
