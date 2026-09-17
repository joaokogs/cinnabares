"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Check, ChevronDown, LoaderCircle, Search, Trash2, X } from "lucide-react"

import { PokeAutocomplete } from "@/components/ui/poke-autocomplete"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TypeIcon as PokemonTypeIcon } from "@/components/ui/pokemon-type-icon"
import { usePokemonBuildData, type BuildStat } from "@/hooks/use-pokemon-build-data"
import type { NamedOption, PokeOption } from "@/hooks/use-pokeapi-data"
import { calculateBuildStat, maxBuildStat, natureEffect, NATURES, STAT_ORDER, TYPE_COLORS } from "@/lib/pokemon-build"
import { cn } from "@/lib/utils"

export type BuildDraft = {
  name: string
  item: string
  ability: string
  nature: string
  ivs: Record<string, number>
  evs: Record<string, number>
  moves: string[]
}

export type BuildEditorOptions = {
  pokemon: PokeOption[]
  items: PokeOption[]
  abilities: NamedOption[]
  natures: NamedOption[]
  moves: NamedOption[]
}

type Props = {
  build: BuildDraft
  index: number
  options: BuildEditorOptions
  onChange: (build: BuildDraft) => void
  onRemove: () => void
  canRemove?: boolean
}

type MoveInfo = {
  name: string
  type: string
  category: string
  power: number | null
  pp: number | null
  ppMax: number | null
}

const moveInfoCache = new Map<string, MoveInfo>()
const moveInfoPromiseCache = new Map<string, Promise<MoveInfo | null>>()

const MOVE_TYPE_FALLBACKS: Record<string, string> = {
  "flare-blitz": "fire", "flamethrower": "fire", "fire-blast": "fire", overheat: "fire", "heat-wave": "fire",
  "close-combat": "fighting", "drain-punch": "fighting", "mach-punch": "fighting", "focus-blast": "fighting", "body-press": "fighting",
  "stone-edge": "rock", "rock-slide": "rock", "stealth-rock": "rock",
  "u-turn": "bug", "bug-buzz": "bug", "first-impression": "bug",
  "earthquake": "ground", "earth-power": "ground", spikes: "ground",
  "thunderbolt": "electric", "volt-switch": "electric", "wild-charge": "electric", discharge: "electric",
  surf: "water", "hydro-pump": "water", scald: "water", liquidation: "water", "aqua-jet": "water",
  "giga-drain": "grass", "leaf-storm": "grass", "energy-ball": "grass", "grassy-glide": "grass", "wood-hammer": "grass",
  "ice-beam": "ice", "icy-wind": "ice", "freeze-dry": "ice", "ice-spinner": "ice",
  hurricane: "flying", "brave-bird": "flying", roost: "flying",
  psychic: "psychic", psyshock: "psychic", "expanding-force": "psychic",
  "dark-pulse": "dark", "knock-off": "dark", "sucker-punch": "dark", "foul-play": "dark",
  "draco-meteor": "dragon", "dragon-claw": "dragon", outrage: "dragon",
  "flash-cannon": "steel", "iron-head": "steel",
  moonblast: "fairy", "dazzling-gleam": "fairy", "play-rough": "fairy",
  "shadow-ball": "ghost", poltergeist: "ghost", "shadow-sneak": "ghost",
  "sludge-bomb": "poison", "gunk-shot": "poison", toxic: "poison",
  "hyper-voice": "normal", "extreme-speed": "normal", return: "normal",
}

function titleCase(name: string) {
  return name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function MoveTypeIcon({ type }: { type: string }) {
  return <PokemonTypeIcon type={type} size={22} className="shrink-0" />
}

function getMoveType(name: string, info: MoveInfo | null) {
  return info?.type ?? MOVE_TYPE_FALLBACKS[name] ?? "normal"
}

function MoveCategoryBadge({ category }: { category: string }) {
  const styles = {
    physical: "bg-orange-500/15 text-orange-400",
    special: "bg-blue-500/15 text-blue-400",
    status: "bg-violet-500/15 text-violet-400",
  }
  const labels = { physical: "Phy", special: "Spc", status: "Sta" }
  const key = category in styles ? category as keyof typeof styles : "status"
  return <span className={cn("inline-flex items-center px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase leading-none", styles[key])}>{labels[key]}</span>
}

function loadMoveInfo(name: string) {
  if (!name) return Promise.resolve<MoveInfo | null>(null)
  const cached = moveInfoCache.get(name)
  if (cached) return Promise.resolve(cached)
  const pending = moveInfoPromiseCache.get(name)
  if (pending) return pending
  const request = fetch(`https://pokeapi.co/api/v2/move/${encodeURIComponent(name)}`)
    .then((response) => {
      if (!response.ok) throw new Error("Move data unavailable")
      return response.json() as Promise<{ name: string; type: { name: string }; damage_class: { name: string }; power: number | null; pp: number | null }>
    })
    .then((move) => {
      const nextData = { name: move.name, type: move.type.name, category: move.damage_class.name, power: move.power, pp: move.pp, ppMax: move.pp === null ? null : move.pp + Math.ceil(move.pp / 5) * 3 }
      moveInfoCache.set(name, nextData)
      return nextData
    })
    .catch(() => null)
  moveInfoPromiseCache.set(name, request)
  return request
}

function useMoveInfo(name: string) {
  const [data, setData] = useState<MoveInfo | null>(() => moveInfoCache.get(name) ?? null)
  useEffect(() => {
    if (!name || moveInfoCache.has(name)) return
    let active = true
    const request = loadMoveInfo(name)
    request.then((nextData) => { if (active && nextData) setData(nextData) })
    return () => { active = false }
  }, [name])
  return data
}

function NaturePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const filtered = Object.keys(NATURES).filter((nature) => nature.includes(query.toLowerCase().trim()))
  return (
    <Popover open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setQuery("") }}>
      <PopoverTrigger type="button" className="flex h-8 w-full items-center gap-2 border border-border bg-background/70 px-3 text-left text-xs transition-colors hover:bg-muted">
        <span className={cn("font-medium", !value && "text-muted-foreground")}>{value ? titleCase(value) : "Nature"}</span>
        <ChevronDown className="ml-auto size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] overflow-hidden p-0">
        <div className="flex items-center border-b border-border px-3"><Search className="mr-2 size-3.5 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search nature..." className="h-10 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" /></div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.map((nature) => { const modifier = NATURES[nature]; const neutral = modifier.boost === modifier.reduce; return <button key={nature} type="button" onClick={() => { onChange(nature); setOpen(false) }} className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted", value === nature && "bg-muted")}><span className="font-semibold">{titleCase(nature)}</span>{neutral ? <span className="ml-auto text-[10px] text-muted-foreground">Neutral</span> : <span className="ml-auto flex gap-1"><span className="rounded-sm bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">↑{modifier.boost.toUpperCase()}</span><span className="rounded-sm bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">↓{modifier.reduce.toUpperCase()}</span></span>}</button> })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AbilityPicker({ value, abilities, onChange }: { value: string; abilities: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const filtered = abilities.filter((ability) => ability.includes(query.toLowerCase().trim()))
  return (
    <Popover open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setQuery("") }}>
      <PopoverTrigger type="button" className="flex h-8 w-full items-center gap-2 border border-border bg-background/70 px-3 text-left text-xs transition-colors hover:bg-muted"><span className={cn("truncate font-medium", !value && "text-muted-foreground")}>{value ? titleCase(value) : "Ability"}</span><ChevronDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" /></PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] overflow-hidden p-0"><div className="flex items-center border-b border-border px-3"><Search className="mr-2 size-3.5 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ability..." className="h-10 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" /></div><div className="max-h-56 overflow-y-auto p-1">{filtered.map((ability) => <button key={ability} type="button" onClick={() => { onChange(ability); setOpen(false) }} className={cn("flex w-full items-center rounded-md px-2.5 py-2 text-left text-xs hover:bg-muted", value === ability && "bg-muted")}>{titleCase(ability)}{value === ability ? <Check className="ml-auto size-3.5" /> : null}</button>)}</div></PopoverContent>
    </Popover>
  )
}

function StatEditor({ build, data, onChange }: { build: BuildDraft; data: NonNullable<ReturnType<typeof usePokemonBuildData>["data"]>; onChange: (build: BuildDraft) => void }) {
  const totalEvs = Object.values(build.evs).reduce((total, value) => total + value, 0)
  const remainingEvs = 510 - totalEvs
  function updateStat(kind: "ivs" | "evs", stat: BuildStat, rawValue: string) {
    const max = kind === "ivs" ? 31 : 252
    const value = Math.max(0, Math.min(max, Number(rawValue) || 0))
    if (kind === "evs" && totalEvs - build.evs[stat] + value > 510) return
    onChange({ ...build, [kind]: { ...build[kind], [stat]: value } })
  }
  return (
    <section className="border border-border bg-background/30 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Stats at Lv. 50</p><div className="flex items-center gap-3 text-[10px] text-muted-foreground"><span className={remainingEvs < 0 ? "text-destructive" : ""}>{remainingEvs} remaining</span><button type="button" onClick={() => onChange({ ...build, evs: Object.fromEntries(STAT_ORDER.map(([stat]) => [stat, 0])) })} className="underline underline-offset-2 hover:text-foreground">Reset EVs</button><button type="button" onClick={() => onChange({ ...build, ivs: Object.fromEntries(STAT_ORDER.map(([stat]) => [stat, 31])) })} className="underline underline-offset-2 hover:text-foreground">Max IVs</button></div></div>
      <div className="mb-1 hidden items-center gap-2 px-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:flex"><span className="w-8" /><span className="w-8 text-right">Base</span><span className="w-8 text-center">IV</span><span className="flex-1 text-center">EV</span><span className="w-5 text-center">Nat</span><span className="w-10 text-right">Final</span><span className="hidden w-24 lg:block" /></div>
      <div className="space-y-1">{STAT_ORDER.map(([stat, label]) => { const finalStat = calculateBuildStat({ base: data.baseStats[stat], iv: build.ivs[stat], ev: build.evs[stat], stat, nature: build.nature }); const effect = natureEffect(build.nature, stat); const percent = Math.min(100, (finalStat / maxBuildStat(data.baseStats[stat], stat)) * 100); return <div key={stat} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-sm px-1 py-1.5 hover:bg-muted/40"><span className="w-8 text-[11px] font-bold">{label}</span><span className="hidden w-8 text-right font-mono text-[10px] text-muted-foreground sm:block">{data.baseStats[stat]}</span><input type="number" min={0} max={31} value={build.ivs[stat]} onChange={(event) => updateStat("ivs", stat, event.target.value)} aria-label={`${label} IV`} className="h-6 w-8 border border-border bg-transparent px-0.5 text-center text-[10px] font-mono outline-none focus:border-ring" /><div className="flex min-w-[150px] flex-1 items-center gap-2"><input type="range" min={0} max={252} value={build.evs[stat]} onChange={(event) => updateStat("evs", stat, event.target.value)} aria-label={`${label} EV`} className="build-range min-w-0 flex-1" style={{ background: `linear-gradient(to right, var(--accent) ${(build.evs[stat] / 252) * 100}%, var(--muted) ${(build.evs[stat] / 252) * 100}%)` }} /><input type="number" min={0} max={252} value={build.evs[stat]} onChange={(event) => updateStat("evs", stat, event.target.value)} aria-label={`${label} EV value`} className="h-6 w-9 border border-border bg-transparent px-0.5 text-center text-[10px] font-mono outline-none focus:border-ring" /></div><span className={cn("w-5 text-center text-[11px] font-bold", effect === "boost" && "text-emerald-500", effect === "reduce" && "text-red-400", effect === "neutral" && "text-muted-foreground")}>{effect === "boost" ? "↑" : effect === "reduce" ? "↓" : "−"}</span><span className="w-10 text-right font-mono text-xs font-bold">{finalStat}</span><div className="hidden h-2 w-24 overflow-hidden bg-muted lg:block"><div className={cn("h-full transition-all", effect === "boost" ? "bg-emerald-500" : effect === "reduce" ? "bg-red-400" : "bg-foreground/70")} style={{ width: `${percent}%` }} /></div></div> })}</div>
    </section>
  )
}

function MoveMeta({ info, color }: { info: MoveInfo | null; color: string }) {
  if (!info) return null
  return <span className="flex shrink-0 items-center gap-2">{info.category !== "status" && info.power !== null ? <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold" style={{ backgroundColor: `${color}25`, color }}>{info.power}</span> : null}{info.ppMax !== null ? <span className="font-mono text-[10px] text-muted-foreground">{info.ppMax}</span> : null}<MoveCategoryBadge category={info.category} /></span>
}

function MoveSlot({ name, onClick, onClear }: { name: string; onClick: () => void; onClear: () => void }) {
  const info = useMoveInfo(name)
  const type = getMoveType(name, info)
  const color = TYPE_COLORS[type]
  return <div className="group relative flex min-h-11 items-center gap-2 border border-border bg-muted/60 px-3 py-2.5" style={{ backgroundColor: `${color}15`, borderLeftColor: color, borderLeftWidth: 4 }}><button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2.5 text-left"><MoveTypeIcon type={type} /><span className="flex-1 truncate text-xs font-semibold">{info?.name ? titleCase(info.name) : name ? titleCase(name) : "Move"}</span><MoveMeta info={info} color={color} /></button>{name ? <button type="button" onClick={onClear} className="absolute right-1 hidden size-5 place-items-center text-muted-foreground hover:text-destructive group-hover:grid" aria-label="Remover move"><X className="size-3" /></button> : null}</div>
}

function MovePickerOption({ name, selected, onSelect }: { name: string; selected: boolean; onSelect: () => void }) {
  const info = useMoveInfo(name)
  async function handleSelect() {
    if (!moveInfoCache.has(name)) await loadMoveInfo(name)
    onSelect()
  }
  return <button type="button" onClick={() => void handleSelect()} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs hover:bg-muted"><MoveTypeIcon type={getMoveType(name, info)} /><span className="flex-1">{titleCase(info?.name ?? name)}</span>{selected ? <Check className="size-3.5 text-accent" /> : null}</button>
}

function MovesEditor({ build, availableMoves, onChange }: { build: BuildDraft; availableMoves: string[]; onChange: (build: BuildDraft) => void }) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => { const normalized = query.trim().toLowerCase().replace(/[-\s]+/g, ""); return availableMoves.filter((move) => !normalized || move.replace(/[-\s]+/g, "").includes(normalized)).slice(0, 60) }, [availableMoves, query])
  function selectMove(move: string) { if (activeSlot === null) return; const moves = [...build.moves]; const existing = moves.indexOf(move); if (existing !== -1 && existing !== activeSlot) moves[existing] = ""; moves[activeSlot] = move; onChange({ ...build, moves }); setActiveSlot(null); setQuery("") }
  function clearMove(slot: number) { const moves = [...build.moves]; moves[slot] = ""; onChange({ ...build, moves }) }
  return <section className="border border-border bg-background/30 p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Golpes</p><span className="text-xs text-muted-foreground">{build.moves.filter(Boolean).length}/4</span></div><div className="grid gap-1 sm:grid-cols-2">{[0, 1, 2, 3].map((slot) => <MoveSlot key={slot} name={build.moves[slot]} onClick={() => { setActiveSlot(activeSlot === slot ? null : slot); setQuery("") }} onClear={() => clearMove(slot)} />)}</div>{activeSlot !== null ? <div className="mt-3 space-y-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar golpe para slot ${activeSlot + 1}...`} className="h-10 w-full border border-border bg-muted/60 pl-9 pr-3 text-xs outline-none focus:border-ring" /></div><div className="max-h-64 overflow-y-auto border border-border bg-card p-1">{filtered.map((move) => <MovePickerOption key={move} name={move} selected={build.moves.includes(move)} onSelect={() => selectMove(move)} />)}{filtered.length === 0 ? <p className="p-4 text-center text-xs text-muted-foreground">Nenhum golpe encontrado.</p> : null}</div></div> : null}</section>
}

export function TeamBuildEditor({ build, index, options, onChange, onRemove }: Props) {
  const { data, loading, error } = usePokemonBuildData(build.name)
  const abilities = data?.abilities.length ? data.abilities : options.abilities.map((option) => option.name)
  const availableMoves = data?.moves.length ? data.moves : options.moves.map((option) => option.name)
  function update<K extends keyof BuildDraft>(key: K, value: BuildDraft[K]) { onChange({ ...build, [key]: value }) }
  return <div className="space-y-3 rounded-xl border border-border/80 bg-card p-3 sm:p-4"><div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Pokémon {index + 1}</p><button type="button" onClick={onRemove} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remover Pokémon"><Trash2 className="size-4" /></button></div><label className="block space-y-1.5 text-xs font-medium">Pokémon<PokeAutocomplete id={`post-pokemon-${index}`} value={build.name} onChange={(value) => onChange({ ...build, name: value, ability: "", nature: "", moves: ["", "", "", ""] })} options={options.pokemon} kind="pokemon" placeholder="Busque um Pokémon" required /></label>{loading ? <div className="flex items-center gap-2 border border-border bg-background/30 p-4 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Carregando dados competitivos...</div> : null}{error ? <p className="text-xs text-destructive">{error}</p> : null}{data ? <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)]"><aside className="space-y-3"><div className="border border-border bg-background/35 p-3"><div className="flex flex-col items-center gap-2"><div className="grid size-28 place-items-center border border-border bg-muted/50"><Image src={data.spriteUrl} alt={data.displayName} width={96} height={96} unoptimized className="size-24 object-contain" /></div><p className="font-heading text-base font-bold">{data.displayName}</p><div className="flex gap-1">{data.types.map((type) => <span key={type} className="px-2 py-0.5 text-[9px] font-bold uppercase text-white" style={{ backgroundColor: TYPE_COLORS[type] }}>{type}</span>)}</div></div></div><div className="border border-border bg-background/35 p-3"><div className="grid grid-cols-[1fr_52px] gap-3"><div className="space-y-1.5"><label className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Nature</label><NaturePicker value={build.nature} onChange={(value) => update("nature", value)} /></div><div className="space-y-1.5"><label className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Level</label><div className="flex h-8 items-center justify-center border border-border bg-muted/40 font-mono text-xs font-bold">50</div></div></div></div><div className="space-y-3 border border-border bg-background/35 p-3"><div className="space-y-1.5"><label className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Item</label><PokeAutocomplete id={`post-item-${index}`} value={build.item} onChange={(value) => update("item", value)} options={options.items} kind="item" placeholder="Item" /></div><div className="space-y-1.5"><label className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Ability</label><AbilityPicker value={build.ability} abilities={abilities} onChange={(value) => update("ability", value)} /></div></div></aside><main className="min-w-0 space-y-3"><StatEditor build={build} data={data} onChange={onChange} /><MovesEditor build={build} availableMoves={availableMoves} onChange={onChange} /></main></div> : null}</div>
}
