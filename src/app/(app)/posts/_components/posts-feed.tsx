/* eslint-disable quality/max-lines */
"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Bookmark,
  ChevronDown,
  Heart,
  LoaderCircle,
  MessageCircle,
  Pin,
  Plus,
  Reply,
  Search,
  Send,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getMentionOptions, MentionTextarea, MoveHoverCard, RichMentionText, type MentionOption } from "@/components/ui/mention-textarea"
import { PokeAutocomplete } from "@/components/ui/poke-autocomplete"
import { TypeIcon } from "@/components/ui/pokemon-type-icon"
import { usePokeApiData, type NamedOption, type PokeOption } from "@/hooks/use-pokeapi-data"
import type { PostFeedItem, PostPokemon } from "@/lib/posts/types"
import { TYPE_COLORS } from "@/lib/pokemon-build"
import { cn } from "@/lib/utils"
import { TeamBuildEditor as BuildEditor } from "./build-editor"

const STAT_NAMES = [
  ["hp", "HP"],
  ["atk", "ATK"],
  ["def", "DEF"],
  ["spa", "SpA"],
  ["spd", "SpD"],
  ["spe", "SPE"],
] as const

type BuildDraft = {
  name: string
  description: string
  item: string
  ability: string
  nature: string
  ivs: Record<string, number>
  evs: Record<string, number>
  moves: string[]
}

type BuildEditorOptions = {
  pokemon: PokeOption[]
  items: PokeOption[]
  abilities: NamedOption[]
  natures: NamedOption[]
  moves: NamedOption[]
}

function emptyBuild(): BuildDraft {
  return {
    name: "",
    description: "",
    item: "",
    ability: "",
    nature: "",
    ivs: Object.fromEntries(STAT_NAMES.map(([key]) => [key, 31])),
    evs: Object.fromEntries(STAT_NAMES.map(([key]) => [key, 0])),
    moves: ["", "", "", ""],
  }
}

function formatName(name: string) {
  return name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function relativeDate(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return "agora"
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
  return (
    <div className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent/15 font-heading text-xs font-bold text-accent" style={{ width: size, height: size }}>
      {url ? <Image src={url} alt="" width={size} height={size} unoptimized className="size-full object-cover" /> : name.slice(0, 1).toUpperCase()}
    </div>
  )
}

function ActionButton({ label, count, active, icon: Icon, onClick }: {
  label: string
  count: number
  active: boolean
  icon: typeof Heart
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={active} className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent", active && "bg-accent/10 text-accent")}>
      <Icon className={cn("size-4", active && "fill-current")} aria-hidden="true" />
      <span>{count}</span>
    </button>
  )
}

type DisplayPokemonMeta = { id: number; types: string[] }
const displayPokemonCache = new Map<string, DisplayPokemonMeta>()
const displayMoveTypeCache = new Map<string, string>()

function BuildMoveBadge({ move }: { move: string }) {
  const [type, setType] = useState(() => displayMoveTypeCache.get(move) ?? "normal")
  useEffect(() => {
    if (!move || displayMoveTypeCache.has(move)) return
    let active = true
    fetch(`https://pokeapi.co/api/v2/move/${encodeURIComponent(move)}`)
      .then((response) => response.json() as Promise<{ type: { name: string } }>)
      .then((data) => {
        displayMoveTypeCache.set(move, data.type.name)
        if (active) setType(data.type.name)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [move])
  const color = TYPE_COLORS[type] ?? TYPE_COLORS.normal
  return <MoveHoverCard name={move} className="block min-w-0"><span className="flex min-w-0 items-center gap-2 border border-border/70 bg-muted/70 px-2.5 py-2" style={{ borderLeftColor: color, borderLeftWidth: 3 }}><TypeIcon type={type} size={18} className="shrink-0" /><span className="truncate font-mono text-[11px] font-semibold">{formatName(move)}</span></span></MoveHoverCard>
}

// eslint-disable-next-line complexity
function BuildPokemonCard({ pokemon, options, mentionOptions, expanded, onToggle }: { pokemon: PostPokemon; options: PokeOption[]; mentionOptions: MentionOption[]; expanded: boolean; onToggle: () => void }) {
  const selected = options.find((option) => option.name === pokemon.name)
  const [meta, setMeta] = useState<DisplayPokemonMeta | null>(() => displayPokemonCache.get(pokemon.name) ?? null)
  useEffect(() => {
    if (!pokemon.name || displayPokemonCache.has(pokemon.name)) return
    let active = true
    fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemon.name)}`)
      .then((response) => response.json() as Promise<{ id: number; types: { type: { name: string } }[] }>)
      .then((data) => {
        const nextMeta = { id: data.id, types: data.types.map(({ type }) => type.name) }
        displayPokemonCache.set(pokemon.name, nextMeta)
        if (active) setMeta(nextMeta)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [pokemon.name])
  const evSummary = STAT_NAMES.filter(([key]) => (pokemon.evs[key] ?? 0) > 0).map(([key, label]) => `${pokemon.evs[key]} ${label}`).join(" / ")
  return (
    <details open={expanded} className="group rounded-xl border border-border/70 bg-background/35">
      <summary onClick={(event) => { event.preventDefault(); onToggle() }} className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden">
        {selected?.iconUrl ? <Image src={selected.iconUrl} alt="" width={52} height={52} unoptimized className="size-12 object-contain" /> : <div className="grid size-12 place-items-center rounded-lg bg-muted text-xs">?</div>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">#{meta?.id ?? "---"}</span><p className="truncate font-heading text-base font-bold">{formatName(pokemon.name)}</p>{meta?.types.map((type) => <span key={type} className="px-1.5 py-0.5 text-[9px] font-bold uppercase text-white" style={{ backgroundColor: TYPE_COLORS[type] }}>{type}</span>)}</div>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">Lv. 50 · {pokemon.nature ? formatName(pokemon.nature) : "Nature não informada"}</p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-3 border-t border-border/60 px-3 py-3 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0"><p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Item</p><div className="flex items-center gap-2 font-semibold">{pokemon.item ? <Image src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(pokemon.item)}.png`} alt="" width={24} height={24} unoptimized className="size-6 object-contain" /> : null}<span className="truncate">{pokemon.item ? formatName(pokemon.item) : "Sem item"}</span></div></div>
          <div className="min-w-0"><p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ability</p><p className="truncate font-semibold">{pokemon.ability ? formatName(pokemon.ability) : "Não informada"}</p></div>
        </div>
        <div><p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Moveset</p><div className="grid gap-1.5 sm:grid-cols-2">{pokemon.moves.filter(Boolean).map((move) => <BuildMoveBadge key={move} move={move} />)}{pokemon.moves.filter(Boolean).length === 0 ? <span className="text-muted-foreground">Não informado</span> : null}</div></div>
        <div className="border-t border-border/60 pt-2.5"><div className="mb-2 flex items-center justify-between"><p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IVs / EVs</p><span className="font-mono text-[10px] text-muted-foreground">Lv. 50</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{STAT_NAMES.map(([key, label]) => <div key={key} className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5"><p className="font-mono text-[10px] font-bold text-foreground">{label}</p><div className="mt-1 flex items-center justify-between gap-2 text-[10px]"><span className="text-muted-foreground">IV <strong className="text-foreground">{pokemon.ivs[key] ?? 0}</strong></span><span className="text-muted-foreground">EV <strong className="text-accent">{pokemon.evs[key] ?? 0}</strong></span></div></div>)}</div>{evSummary ? <p className="mt-2 font-mono text-[10px] font-semibold text-foreground">EVs: {evSummary}</p> : null}</div>
        {pokemon.description ? <div className="border-t border-border/60 pt-3"><p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">Descrição</p><p className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground"><RichMentionText text={pokemon.description} options={mentionOptions} /></p></div> : null}
      </div>
    </details>
  )
}

function sortComments(comments: PostFeedItem["comments"]) {
  return comments.slice().sort((first, second) => Number(second.pinned) - Number(first.pinned) || (first.pinnedAt && second.pinnedAt ? new Date(first.pinnedAt).getTime() - new Date(second.pinnedAt).getTime() : new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()))
}

type CommentPinOverride = { pinned: boolean; pinnedAt: string | null }

function applyPinOverrides(comments: PostFeedItem["comments"], overrides: Record<string, CommentPinOverride>): PostFeedItem["comments"] {
  return sortComments(comments.map((comment) => ({ ...comment, ...(overrides[comment.id] ?? {}), replies: applyPinOverrides(comment.replies, overrides) })))
}

// eslint-disable-next-line complexity
function CommentItem({ item, postId, mentionOptions, canPin, onPinChange, onReply, depth = 0 }: { item: PostFeedItem["comments"][number]; postId: string; mentionOptions: MentionOption[]; canPin: boolean; onPinChange: (commentId: string, pinned: boolean, pinnedAt: string | null) => void; onReply: (parentId: string, body: string) => Promise<void>; depth?: number }) {
  const [reply, setReply] = useState("")
  const [replying, setReplying] = useState(false)
  const [sending, setSending] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [liked, setLiked] = useState(item.liked)
  const [likes, setLikes] = useState(item.likes)
  const [likePending, setLikePending] = useState(false)
  const [pinned, setPinned] = useState(item.pinned)
  const [pinPending, setPinPending] = useState(false)
  const [pinnedAt, setPinnedAt] = useState(item.pinnedAt)

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reply.trim() || sending) return
    setSending(true)
    await onReply(item.id, reply)
    setReply("")
    setReplying(false)
    setSending(false)
  }

  async function toggleLike() {
    if (likePending) return
    setLikePending(true)
    const response = await fetch(`/api/posts/${postId}/comments/${item.id}/like`, { method: "POST" })
    if (response.ok) {
      const result = await response.json() as { active: boolean }
      setLiked(result.active)
      setLikes((current) => Math.max(0, current + (result.active ? 1 : -1)))
    }
    setLikePending(false)
  }

  function applyPinState(nextPinned: boolean, nextPinnedAt: string | null) {
    setPinned(nextPinned)
    setPinnedAt(nextPinnedAt)
    onPinChange(item.id, nextPinned, nextPinnedAt)
  }

  async function togglePin() {
    if (pinPending) return
    setPinPending(true)
    const previousPinned = pinned
    const previousPinnedAt = pinnedAt
    const nextPinned = !previousPinned
    const nextPinnedAt = nextPinned ? new Date().toISOString() : null
    applyPinState(nextPinned, nextPinnedAt)
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${item.id}/pin`, { method: "POST" })
      if (!response.ok) throw new Error("Não foi possível atualizar o comentário")
      const result = await response.json() as { pinned: boolean }
      if (result.pinned !== nextPinned) {
        applyPinState(result.pinned, result.pinned ? nextPinnedAt : null)
      }
    } catch {
      applyPinState(previousPinned, previousPinnedAt)
    } finally {
      setPinPending(false)
    }
  }

  return <div id={`comment-${item.id}`} className={cn("space-y-2", depth > 0 && "ml-7 border-l border-border/60 pl-3")}><div className="flex gap-2.5"><Avatar name={item.author.name} url={item.author.avatarUrl} size={28} /><div className="min-w-0 flex-1 rounded-xl bg-muted/60 px-3 py-2"><p className="text-xs font-semibold">{item.author.name} <span className="font-normal text-muted-foreground">· {relativeDate(item.createdAt)}</span></p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted-foreground"><RichMentionText text={item.body} options={mentionOptions} /></p><div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-semibold"><button type="button" onClick={() => void toggleLike()} disabled={likePending} className={cn("inline-flex items-center gap-1 text-muted-foreground hover:text-accent", liked && "text-accent")} aria-label={liked ? "Remover like do comentário" : "Curtir comentário"}><Heart className={cn("size-3", liked && "fill-current")} /> {likes}</button>{pinned ? <span className="inline-flex items-center gap-1 text-accent"><Pin className="size-3" /> Fixado</span> : null}{canPin ? <button type="button" onClick={() => void togglePin()} disabled={pinPending} className="inline-flex items-center gap-1 text-muted-foreground hover:text-accent"><Pin className="size-3" /> {pinned ? "Desfixar" : "Fixar"}</button> : null}<button type="button" onClick={() => setReplying((value) => !value)} className="inline-flex items-center gap-1 text-accent hover:underline"><Reply className="size-3" /> Responder</button></div></div></div>{item.replies.length > 0 ? <button type="button" onClick={() => setShowReplies((value) => !value)} className="ml-10 inline-flex items-center gap-1 text-[10px] font-semibold text-accent hover:underline"><ChevronDown className={cn("size-3 transition-transform", showReplies && "rotate-180")} /> {showReplies ? "Ocultar respostas" : `Exibir ${item.replies.length} resposta${item.replies.length === 1 ? "" : "s"}`}</button> : null}{replying ? <form className="ml-10 flex gap-2" onSubmit={(event) => void submitReply(event)}><div className="min-w-0 flex-1"><MentionTextarea value={reply} onChange={setReply} options={mentionOptions} maxLength={1000} rows={1} placeholder={`Responder ${item.author.name}...`} className="min-h-8 py-1 text-xs" /></div><Button type="submit" size="icon" className="size-8" aria-label="Enviar resposta" disabled={!reply.trim() || sending}>{sending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}</Button></form> : null}{showReplies ? item.replies.map((child) => <CommentItem key={child.id} item={child} postId={postId} mentionOptions={mentionOptions} canPin={canPin} onPinChange={onPinChange} onReply={onReply} depth={depth + 1} />) : null}</div>
}

export function LinkedPostCard({ post, options, mentionOptions, canPin = false, onAction, onComment }: { post: PostFeedItem; options: PokeOption[]; mentionOptions: MentionOption[]; canPin?: boolean; onAction: (postId: string, action: "like" | "repost" | "bookmark") => void; onComment: (postId: string, body: string, parentId?: string) => Promise<void> }) {
  return <div className="relative"><PostCard post={post} options={options} mentionOptions={mentionOptions} canPin={canPin} onAction={onAction} onComment={onComment} /><Link href={`/posts/${post.id}`} aria-label={`Abrir post ${post.title}`} className="absolute inset-x-0 top-0 z-10 h-24 rounded-t-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" /></div>
}

export function PostCard({ post, options, mentionOptions, canPin = post.viewer.isAuthor, onAction, onComment }: { post: PostFeedItem; options: PokeOption[]; mentionOptions: MentionOption[]; canPin?: boolean; onAction: (postId: string, action: "like" | "repost" | "bookmark") => void; onComment: (postId: string, body: string, parentId?: string) => Promise<void> }) {
  const [comment, setComment] = useState("")
  const [commenting, setCommenting] = useState(false)
  const [buildExpanded, setBuildExpanded] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [pinOverrides, setPinOverrides] = useState<Record<string, CommentPinOverride>>({})
  const comments = useMemo(() => applyPinOverrides(post.comments, pinOverrides), [pinOverrides, post.comments])

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!comment.trim() || commenting) return
    setCommenting(true)
    await onComment(post.id, comment)
    setComment("")
    setCommenting(false)
  }

  return (
    <Card className="overflow-visible border-border/70 bg-card/90">
      <CardHeader className="flex flex-row items-start gap-3 border-b border-border/60 pb-4">
        <Avatar name={post.author.name} url={post.author.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-heading text-sm font-semibold">{post.author.name}</span>
            {post.author.username ? <span className="text-xs text-muted-foreground">@{post.author.username}</span> : null}
            <span className="text-xs text-muted-foreground">· {relativeDate(post.createdAt)}</span>
          </div>
          <h2 className="mt-2 font-heading text-lg font-bold tracking-tight">{post.title}</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground"><RichMentionText text={post.description} options={mentionOptions} /></p>
        {post.pokemon.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Build · {post.pokemon.length}/6</p>
              <span className="text-[10px] text-muted-foreground">Clique para ver detalhes</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {post.pokemon.map((pokemon) => <BuildPokemonCard key={pokemon.id} pokemon={pokemon} options={options} mentionOptions={mentionOptions} expanded={buildExpanded} onToggle={() => setBuildExpanded((value) => !value)} />)}
            </div>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-border/60 pt-2">
          <div className="flex items-center gap-1">
            <ActionButton label="Curtir post" count={post.counts.likes} active={post.viewer.liked} icon={Heart} onClick={() => onAction(post.id, "like")} />
            <ActionButton label="Comentar no post" count={post.counts.comments} active={expanded} icon={MessageCircle} onClick={() => setExpanded((value) => !value)} />
          </div>
          <ActionButton label="Salvar post" count={post.counts.bookmarks} active={post.viewer.bookmarked} icon={Bookmark} onClick={() => onAction(post.id, "bookmark")} />
        </div>
        {expanded ? (
          <div className="space-y-3 border-t border-border/60 pt-3">
            {comments.map((item) => <CommentItem key={item.id} item={item} postId={post.id} mentionOptions={mentionOptions} canPin={canPin} onPinChange={(commentId, pinned, pinnedAt) => setPinOverrides((current) => ({ ...current, [commentId]: { pinned, pinnedAt } }))} onReply={(parentId, body) => onComment(post.id, body, parentId)} />)}
            {comments.length === 0 ? <p className="text-xs text-muted-foreground">Seja o primeiro a comentar.</p> : null}
            <form className="flex gap-2" onSubmit={(event) => void submitComment(event)}>
              <div className="min-w-0 flex-1"><MentionTextarea value={comment} onChange={setComment} options={mentionOptions} maxLength={1000} rows={1} placeholder="Escreva um comentário..." className="min-h-9 py-1 text-xs" /></div>
              <Button type="submit" size="icon" aria-label="Enviar comentário" disabled={!comment.trim() || commenting}>{commenting ? <LoaderCircle className="animate-spin" /> : <Send />}</Button>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SelectField({ value, onChange, options, placeholder, id }: { value: string; onChange: (value: string) => void; options: NamedOption[]; placeholder: string; id: string }) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-background/70 px-3 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30">
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.name} value={option.name}>{formatName(option.name)}</option>)}
    </select>
  )
}

export function LegacyBuildEditor({ build, index, options, onChange, onRemove, canRemove }: { build: BuildDraft; index: number; options: BuildEditorOptions; onChange: (build: BuildDraft) => void; onRemove: () => void; canRemove: boolean }) {
  function update<K extends keyof BuildDraft>(key: K, value: BuildDraft[K]) { onChange({ ...build, [key]: value }) }
  function updateStat(kind: "ivs" | "evs", key: string, value: string) { onChange({ ...build, [kind]: { ...build[kind], [key]: Math.max(0, Math.min(kind === "ivs" ? 31 : 252, Number(value) || 0)) } }) }
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/30 p-3">
      <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Pokémon {index + 1}</p>{canRemove ? <button type="button" onClick={onRemove} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remover Pokémon"><Trash2 className="size-4" /></button> : null}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium">Pokémon<PokeAutocomplete id={`post-pokemon-${index}`} value={build.name} onChange={(value) => update("name", value)} options={options.pokemon} kind="pokemon" placeholder="Busque um Pokémon" required /></label>
        <label className="space-y-1.5 text-xs font-medium">Item<PokeAutocomplete id={`post-item-${index}`} value={build.item} onChange={(value) => update("item", value)} options={options.items} kind="item" placeholder="Item segurado" /></label>
        <label className="space-y-1.5 text-xs font-medium" htmlFor={`post-ability-${index}`}>Ability<SelectField id={`post-ability-${index}`} value={build.ability} onChange={(value) => update("ability", value)} options={options.abilities} placeholder="Selecione uma ability" /></label>
        <label className="space-y-1.5 text-xs font-medium" htmlFor={`post-nature-${index}`}>Nature<SelectField id={`post-nature-${index}`} value={build.nature} onChange={(value) => update("nature", value)} options={options.natures} placeholder="Selecione uma nature" /></label>
      </div>
      <div><p className="mb-1.5 text-xs font-medium">Moveset</p><div className="grid gap-2 sm:grid-cols-2">{build.moves.map((move, moveIndex) => <PokeAutocomplete key={moveIndex} id={`post-move-${index}-${moveIndex}`} value={move} onChange={(value) => { const moves = [...build.moves]; moves[moveIndex] = value; update("moves", moves) }} options={options.moves} kind="move" placeholder={`Move ${moveIndex + 1}`} />)}</div></div>
      <div><div className="mb-1.5 flex items-center justify-between"><p className="text-xs font-medium">IVs / EVs</p><span className="text-[10px] text-muted-foreground">Arraste para ajustar</span></div><div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{STAT_NAMES.map(([key, label]) => <div key={key} className="space-y-1.5"><div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground"><span>{label}</span><span>IV {build.ivs[key]} · EV {build.evs[key]}</span></div><input type="range" min={0} max={31} value={build.ivs[key]} onChange={(event) => updateStat("ivs", key, event.target.value)} aria-label={`${label} IV`} className="h-2 w-full cursor-pointer accent-accent" /><input type="range" min={0} max={252} value={build.evs[key]} onChange={(event) => updateStat("evs", key, event.target.value)} aria-label={`${label} EV`} className="h-2 w-full cursor-pointer accent-accent" /></div>)}</div><p className="mt-1.5 text-[10px] text-muted-foreground">Limites: IV 0–31 · EV 0–252 por atributo.</p></div>
    </div>
  )
}

export function CreatePost({ options, mentionOptions, onCreated }: { options: BuildEditorOptions; mentionOptions: MentionOption[]; onCreated: () => Promise<void> }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [builds, setBuilds] = useState<BuildDraft[]>([])
  const [open, setOpen] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, pokemon: builds.filter((build) => build.name.trim()) }) })
      if (!response.ok) { const result = await response.json() as { error?: string }; throw new Error(result.error ?? "Não foi possível publicar o post.") }
      setTitle(""); setDescription(""); setBuilds([]); await onCreated()
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Não foi possível publicar o post.") } finally { setPending(false) }
  }

  return (
    <Card className="overflow-visible border-accent/25 bg-card/90 shadow-lg shadow-black/10">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Compartilhe com a comunidade</p><h2 className="mt-1 font-heading text-xl font-bold">Publique uma estratégia</h2></div><button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={open ? "Recolher editor" : "Expandir editor"}><ChevronDown className={cn("size-5 transition-transform", open && "rotate-180")} /></button></CardHeader>
      {open ? <CardContent className="pt-4"><form className="space-y-4" onSubmit={(event) => void submit(event)}><div className="space-y-4"><label className="block space-y-1.5 text-sm font-medium">Título<input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Core balanceado para o tier OU" className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></label><label className="block space-y-1.5 text-sm font-medium">Descrição<MentionTextarea value={description} onChange={setDescription} options={mentionOptions} required maxLength={5000} placeholder="Use @ para mencionar golpes, itens, natures..." rows={4} /></label></div><div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Build Pokémon <span className="font-normal text-muted-foreground">(opcional)</span></p><p className="text-xs text-muted-foreground">Adicione IVs, EVs, moveset, nature, ability e item.</p></div>{builds.length < 6 ? <Button type="button" variant="outline" size="sm" onClick={() => setBuilds((value) => [...value, emptyBuild()])}><Plus /> Pokémon</Button> : null}</div>{builds.map((build, index) => <BuildEditor key={index} build={build} index={index} options={options} onChange={(value) => setBuilds((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))} onRemove={() => setBuilds((current) => current.filter((_, itemIndex) => itemIndex !== index))} canRemove />)}</div>{error ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" /> Publicando...</> : <><Send /> Publicar post</>}</Button></div></form></CardContent> : null}
    </Card>
  )
}

function PostsResults({ posts, viewerId, options, mentionOptions, onAction, onComment }: { posts: PostFeedItem[]; viewerId: string; options: PokeOption[]; mentionOptions: MentionOption[]; onAction: (postId: string, action: "like" | "repost" | "bookmark") => void; onComment: (postId: string, body: string, parentId?: string) => Promise<void> }) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()
  const filteredPosts = normalizedQuery
    ? posts.filter((post) => [post.title, post.description, post.author.name, post.author.username ?? "", ...post.pokemon.flatMap((pokemon) => [pokemon.name, pokemon.item ?? "", pokemon.ability ?? "", pokemon.nature ?? "", ...pokemon.moves])].join(" ").toLowerCase().includes(normalizedQuery))
    : posts

  return <><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar posts, builds ou Pokémon..." aria-label="Buscar posts" className="h-10 w-full rounded-lg border border-input bg-background/70 pl-9 pr-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" /></div><div className="mt-5 space-y-5">{filteredPosts.length > 0 ? filteredPosts.map((post) => <LinkedPostCard key={post.id} post={post} options={options} mentionOptions={mentionOptions} canPin={post.author.id === viewerId} onAction={onAction} onComment={onComment} />) : <Card className="border-dashed border-border/80 bg-card/50"><CardContent className="py-14 text-center"><p className="font-heading text-lg font-semibold">Nenhum post encontrado</p><p className="mt-2 text-sm text-muted-foreground">Tente buscar por outro termo.</p></CardContent></Card>}</div></>
}

export function PostsFeed({ initialPosts, userName: _userName, viewerId }: { initialPosts: PostFeedItem[]; userName: string; viewerId: string }) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)
  const { pokemon, items, abilities, natures, moves, loading: optionsLoading, error: optionsError } = usePokeApiData()
  const options = useMemo(() => ({ pokemon, items, abilities, natures, moves }), [abilities, items, moves, natures, pokemon])
  const mentionOptions = useMemo(() => getMentionOptions(options), [options])

  async function refreshPosts() {
    setLoading(true)
    try { const response = await fetch("/api/posts", { cache: "no-store" }); if (response.ok) { const result = await response.json() as { posts: PostFeedItem[] }; setPosts(result.posts) } } finally { setLoading(false) }
  }

  async function action(postId: string, actionName: "like" | "repost" | "bookmark") {
    const response = await fetch(`/api/posts/${postId}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName }) })
    if (!response.ok) return
    const result = await response.json() as { active: boolean }
    const countName = actionName === "like" ? "likes" : actionName === "repost" ? "reposts" : "bookmarks"
    const viewerName = actionName === "like" ? "liked" : actionName === "repost" ? "reposted" : "bookmarked"
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, counts: { ...post.counts, [countName]: Math.max(0, post.counts[countName] + (result.active ? 1 : -1)) }, viewer: { ...post.viewer, [viewerName]: result.active } } : post))
  }

  async function comment(postId: string, body: string, parentId?: string) {
    const response = await fetch(`/api/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, parentId }) })
    if (response.ok) await refreshPosts()
  }

  return (
    <main className="relative min-h-screen flex-1 overflow-x-hidden bg-background"><div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-[0.1]" /><section className="relative mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 lg:py-10"><header className="mb-7 flex flex-col gap-2 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">Cinnabares social</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Posts da comunidade</h1></div><p className="max-w-sm text-sm leading-6 text-muted-foreground sm:text-right">Compartilhe suas builds, descubra novas estratégias e ajude outros players.</p></header><div className="space-y-5">{optionsError ? <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">As sugestões da PokéAPI não carregaram. Ainda é possível publicar preenchendo os nomes manualmente.</p> : null}{optionsLoading ? <p className="text-xs text-muted-foreground">Carregando sugestões de Pokémon e itens...</p> : null}{loading && posts.length > 0 ? <p className="text-xs text-muted-foreground">Atualizando feed...</p> : null}<PostsResults posts={posts} viewerId={viewerId} options={pokemon} mentionOptions={mentionOptions} onAction={(postId, actionName) => void action(postId, actionName)} onComment={comment} /></div></section><Link href="/posts/novo" aria-label="Criar novo post" className="fixed right-6 bottom-6 z-30 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/25 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><Plus className="size-4" aria-hidden="true" /> Criar post</Link></main>
  )
}
