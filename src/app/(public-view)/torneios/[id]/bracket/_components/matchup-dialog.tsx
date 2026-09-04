"use client"

import { useState } from "react"
import { EyeOff, GripVertical, Trophy } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { MatchBattle } from "@/db/schema"
import { buildDefaultBattles } from "@/lib/tournaments/battles"
import { cn } from "@/lib/utils"
import type { VisibleRosterEntry } from "@/lib/tournaments/roster"
import { TIER_LABELS } from "@/lib/tournaments/tiers"
import { RosterIcon, capitalize } from "./participant-popover"

type Visibility = "blind" | "partial" | "total"
type MatchStatus = "pending" | "completed"

export type MatchupMatch = {
  id: string
  slot1RegistrationId: string | null
  slot2RegistrationId: string | null
  winnerRegistrationId: string | null
  status: MatchStatus
  score1: number
  score2: number
  slot1Name: string
  slot1GuildTag: string | null
  slot1Roster: VisibleRosterEntry[]
  slot2Name: string
  slot2GuildTag: string | null
  slot2Roster: VisibleRosterEntry[]
  battles: MatchBattle[]
}

type MatchupDialogProps = {
  match: MatchupMatch | null
  visibility: Visibility
  viewerIsAdmin?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveBattles?: (matchId: string, battles: MatchBattle[]) => void
  savingBattles?: boolean
}

type Outcome = "winner" | "loser" | null

function slotLabel(name: string, guildTag: string | null): string {
  return guildTag ? `${name} [${guildTag}]` : name
}

function matchOutcomes(match: MatchupMatch | null): { slot1: Outcome; slot2: Outcome } {
  if (!match || !match.winnerRegistrationId) return { slot1: null, slot2: null }
  if (match.winnerRegistrationId === match.slot1RegistrationId) return { slot1: "winner", slot2: "loser" }
  if (match.winnerRegistrationId === match.slot2RegistrationId) return { slot1: "loser", slot2: "winner" }
  return { slot1: null, slot2: null }
}

function OutcomeBadge({ kind }: { kind: "winner" | "loser" }) {
  return kind === "winner" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"><Trophy className="size-3" aria-hidden="true" /> Vencedor</span>
  ) : <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Perdedor</span>
}

function GuildBox({ label, outcome, isPending }: { label: string; outcome: Outcome; isPending: boolean }) {
  return (
    <div className={cn("min-w-0 flex-1 rounded-xl border px-4 py-3", outcome === "winner" ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/50")}>
      <p className={cn("truncate font-heading text-sm font-semibold", outcome === "winner" && "text-primary")}>{label}</p>
      <div className="mt-2">{outcome ? <OutcomeBadge kind={outcome} /> : isPending ? <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Aguardando resultado</span> : null}</div>
    </div>
  )
}

function ScoreBoard({ completed, score1, score2 }: { completed: boolean; score1: number; score2: number }) {
  if (!completed) return <span className="rounded-full border border-accent/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">VS · Melhor de 5</span>
  return <div className="flex items-center justify-center gap-3"><span className="text-3xl font-bold tabular-nums">{score1}</span><span className="text-muted-foreground" aria-hidden="true">–</span><span className="text-3xl font-bold tabular-nums">{score2}</span><span className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Melhor de 5</span></div>
}

type PlayerSide = "slot1" | "slot2"
type DraggedPlayer = { battleIndex: number; side: PlayerSide }

function getPlayerSwapData({ draft, draggedPlayer, index, side, playerById }: { draft: MatchBattle[]; draggedPlayer: DraggedPlayer | null; index: number; side: PlayerSide; playerById: Map<string, VisibleRosterEntry> }) {
  if (!draggedPlayer) return null
  if (draggedPlayer.side !== side || draggedPlayer.battleIndex === index) return null
  const keys = { slot1: ["slot1PlayerId", "slot2PlayerId"], slot2: ["slot2PlayerId", "slot1PlayerId"] } as const
  const [playerKey, opponentKey] = keys[side]
  const sourceRow = draft[draggedPlayer.battleIndex]
  const targetRow = draft[index]
  const players = [sourceRow[playerKey], targetRow[playerKey], sourceRow[opponentKey], targetRow[opponentKey]].map((playerId) => playerId ? playerById.get(playerId) : undefined)
  if (players.some((player) => !player)) return null
  const [sourcePlayer, targetPlayer, sourceOpponent, targetOpponent] = players as VisibleRosterEntry[]
  if (sourcePlayer.tier !== targetOpponent.tier) return null
  if (targetPlayer.tier !== sourceOpponent.tier) return null
  return { playerKey, sourceIndex: draggedPlayer.battleIndex, sourcePlayerId: sourcePlayer.playerId, targetPlayerId: targetPlayer.playerId }
}

function playerResultLabel(winner: boolean, loser: boolean, editable: boolean) {
  if (winner) return "Venceu"
  if (loser) return "Perdeu"
  return editable ? "Clique para vencer" : "Pendente"
}

function playerResultClass(winner: boolean, loser: boolean) {
  if (winner) return "bg-primary/15 text-primary"
  if (loser) return "bg-destructive/10 text-destructive"
  return "border border-border/70 text-muted-foreground"
}

function PlayerCard({ player, battle, showItems, editable, saving, onSelect, onDragStart, onDragEnd, onDragOver, onDrop }: { player: VisibleRosterEntry; battle: MatchBattle; showItems: boolean; editable: boolean; saving: boolean; onSelect: () => void; onDragStart?: () => void; onDragEnd?: () => void; onDragOver?: (event: React.DragEvent<HTMLButtonElement>) => void; onDrop?: (event: React.DragEvent<HTMLButtonElement>) => void }) {
  const winner = battle.winnerPlayerId === player.playerId
  const loser = Boolean(battle.winnerPlayerId) && !winner
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{player.playerName}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-accent">{TIER_LABELS[player.tier] ?? player.tier}</p>
        </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", playerResultClass(winner, loser))}>{playerResultLabel(winner, loser, editable)}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(player.team ?? []).map((pokemon, index) => (
          <div key={`${pokemon.name}-${index}`} className="relative grid min-h-20 place-items-center rounded-lg border border-border/60 bg-background/70 p-2" title={capitalize(pokemon.name)}>
            <RosterIcon name={pokemon.name} kind="pokemon" className="size-12 sm:size-14" />
            {showItems && pokemon.item ? <span className="absolute right-1 bottom-1 grid size-5 place-items-center rounded-full border border-border bg-card shadow-sm" title={`Item: ${capitalize(pokemon.item)}`}><RosterIcon name={pokemon.item} kind="item" className="size-4" /></span> : null}
          </div>
        ))}
      </div>
    </>
  )

  if (!editable) return <div className={cn("rounded-xl border p-4", winner ? "border-primary/35 bg-primary/[0.04]" : "border-border/60 bg-background/40")}>{content}</div>
  return <button type="button" disabled={saving} draggable={editable && !saving} aria-pressed={winner} onClick={onSelect} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop} className={cn("block w-full rounded-xl border p-4 text-left transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-60", winner ? "border-primary/50 bg-primary/[0.08]" : "border-border/60 bg-background/40")}>{content}</button>
}

function BattleBoard({ battles, slot1Roster, slot2Roster, showItems, editable, saving, onSave }: { battles: MatchBattle[]; slot1Roster: VisibleRosterEntry[]; slot2Roster: VisibleRosterEntry[]; showItems: boolean; editable: boolean; saving: boolean; onSave?: (battles: MatchBattle[]) => void }) {
  const [draft, setDraft] = useState(battles)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<DraggedPlayer | null>(null)
  const playerById = new Map([...slot1Roster, ...slot2Roster].map((player) => [player.playerId, player]))

  function commit(next: MatchBattle[]) {
    setDraft(next)
    onSave?.(next)
  }

  function selectWinner(index: number, playerId: string) {
    if (saving) return
    if (draft[index]?.winnerPlayerId === playerId) return
    commit(draft.map((battle, battleIndex) => battleIndex === index ? { ...battle, winnerPlayerId: playerId } : battle))
  }

  function moveBattle(index: number, target: number) {
    if (saving || index === target || target < 0 || target >= draft.length) return
    const next = [...draft]
    const [battle] = next.splice(index, 1)
    next.splice(target, 0, battle)
    commit(next.map((currentBattle) => ({ ...currentBattle, winnerPlayerId: null })))
  }

  function handleDrop(index: number) {
    if (draggedIndex !== null) moveBattle(draggedIndex, index)
    setDraggedIndex(null)
  }

  function swapPlayer(index: number, side: PlayerSide) {
    if (saving) return
    const swapData = getPlayerSwapData({ draft, draggedPlayer, index, side, playerById })
    if (!swapData) return
    const { playerKey, sourceIndex, sourcePlayerId, targetPlayerId } = swapData
    const next = [...draft]
    next[sourceIndex] = { ...next[sourceIndex], [playerKey]: targetPlayerId, winnerPlayerId: null }
    next[index] = { ...next[index], [playerKey]: sourcePlayerId, winnerPlayerId: null }
    setDraggedPlayer(null)
    commit(next.map((battle) => ({ ...battle, winnerPlayerId: null })))
  }

  return (
    <section className="mt-6 rounded-xl border border-accent/30 bg-accent/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-heading text-base font-semibold">Batalhas da série</h3><p className="mt-1 text-xs text-muted-foreground">{editable ? "Clique no player vencedor e arraste as batalhas para trocar a ordem." : "Os cards mostram o vencedor de cada duelo."}</p></div>
        <span className="rounded-full border border-border/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{draft.filter((battle) => battle.winnerPlayerId).length}/{draft.length} definidas</span>
      </div>
      <div className="mt-4 space-y-3">
        {draft.map((battle, index) => {
          const slot1 = battle.slot1PlayerId ? playerById.get(battle.slot1PlayerId) : undefined
          const slot2 = battle.slot2PlayerId ? playerById.get(battle.slot2PlayerId) : undefined
          if (!slot1 || !slot2) return null
          return (
            <div key={`${battle.slot1PlayerId}-${battle.slot2PlayerId}-${index}`} onDragOver={(event) => { if (draggedIndex !== null) event.preventDefault() }} onDrop={() => handleDrop(index)} onKeyDown={(event) => { if (event.key === "ArrowUp") moveBattle(index, index - 1); if (event.key === "ArrowDown") moveBattle(index, index + 1) }} tabIndex={editable ? 0 : -1} aria-label={`Batalha ${index + 1}. Arraste para alterar a ordem.`} className={cn("rounded-xl border border-border/60 bg-background/70 p-3 outline-none focus-visible:ring-2 focus-visible:ring-accent", draggedIndex === index && "opacity-50")}>
              <div className="mb-2 flex items-center justify-between gap-2"><div><span className="text-xs font-bold uppercase tracking-wider text-accent">Batalha {index + 1}</span><p className={cn("mt-1 text-[10px] font-semibold uppercase tracking-wider", slot1.tier === slot2.tier ? "text-muted-foreground" : "text-destructive")}>Categoria: {TIER_LABELS[slot1.tier] ?? slot1.tier}{slot1.tier === slot2.tier ? "" : ` vs ${TIER_LABELS[slot2.tier] ?? slot2.tier}`}</p></div>{editable ? <span draggable onDragStart={() => setDraggedIndex(index)} onDragEnd={() => setDraggedIndex(null)} className="inline-flex cursor-grab items-center gap-1 text-[10px] text-muted-foreground active:cursor-grabbing" aria-label={`Arrastar batalha ${index + 1}`}><GripVertical className="size-3.5" /> Arraste</span> : null}</div>
              <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                <PlayerCard player={slot1} battle={battle} showItems={showItems} editable={editable} saving={saving} onSelect={() => selectWinner(index, slot1.playerId)} onDragStart={() => setDraggedPlayer({ battleIndex: index, side: "slot1" })} onDragEnd={() => setDraggedPlayer(null)} onDragOver={(event) => { if (draggedPlayer?.side === "slot1") event.preventDefault() }} onDrop={(event) => { event.stopPropagation(); swapPlayer(index, "slot1") }} />
                <span className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">vs</span>
                <PlayerCard player={slot2} battle={battle} showItems={showItems} editable={editable} saving={saving} onSelect={() => selectWinner(index, slot2.playerId)} onDragStart={() => setDraggedPlayer({ battleIndex: index, side: "slot2" })} onDragEnd={() => setDraggedPlayer(null)} onDragOver={(event) => { if (draggedPlayer?.side === "slot2") event.preventDefault() }} onDrop={(event) => { event.stopPropagation(); swapPlayer(index, "slot2") }} />
              </div>
            </div>
          )
        })}
      </div>
      {editable ? <p className="mt-3 text-[11px] text-muted-foreground">Clique em outro player para trocar o vencedor. Reordenar as batalhas limpa os vencedores para evitar resultados incorretos.</p> : null}
    </section>
  )
}

function MatchupBody({ match, slot1Label, slot2Label, outcomes, blind, showItems, editable, savingBattles, onSaveBattles }: { match: MatchupMatch; slot1Label: string; slot2Label: string; outcomes: { slot1: Outcome; slot2: Outcome }; blind: boolean; showItems: boolean; editable: boolean; savingBattles: boolean; onSaveBattles?: (battles: MatchBattle[]) => void }) {
  const displayBattles = match.battles.length > 0 ? match.battles : buildDefaultBattles(match.slot1Roster, match.slot2Roster)
  return (
    <>
      <div className="mb-5 flex items-center justify-center rounded-xl border border-border/60 bg-background/50 px-4 py-4"><ScoreBoard completed={match.status === "completed"} score1={match.score1} score2={match.score2} /></div>
      <div className="mb-6 flex items-stretch gap-3"><GuildBox label={slot1Label} outcome={outcomes.slot1} isPending={match.status !== "completed"} /><div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground" aria-hidden="true">vs</div><GuildBox label={slot2Label} outcome={outcomes.slot2} isPending={match.status !== "completed"} /></div>
      {blind ? <p className="mb-5 flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"><EyeOff className="size-4 shrink-0" aria-hidden="true" /> Escalação oculta: este torneio é blind.</p> : !editable && match.status === "completed" && match.battles.length === 0 ? <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-3 text-sm text-muted-foreground">Resultado registrado sem detalhamento das batalhas individuais.</p> : <BattleBoard key={`${match.id}-${JSON.stringify(match.battles)}`} battles={displayBattles} slot1Roster={match.slot1Roster} slot2Roster={match.slot2Roster} showItems={showItems} editable={editable} saving={savingBattles} onSave={onSaveBattles} />}
    </>
  )
}

export function MatchupDialog({ match, visibility, viewerIsAdmin = false, open, onOpenChange, onSaveBattles, savingBattles = false }: MatchupDialogProps) {
  if (!match) return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-5xl" /></Dialog>

  const slot1Label = slotLabel(match.slot1Name, match.slot1GuildTag)
  const slot2Label = slotLabel(match.slot2Name, match.slot2GuildTag)
  const blind = visibility === "blind" && !viewerIsAdmin
  const editable = viewerIsAdmin && Boolean(onSaveBattles) && !blind
  const outcomes = matchOutcomes(match)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader><DialogTitle>Ordem de luta</DialogTitle><DialogDescription>{slot1Label} contra {slot2Label} — série melhor de 5</DialogDescription></DialogHeader>
        <div className="max-h-[76vh] overflow-y-auto pr-1"><MatchupBody match={match} slot1Label={slot1Label} slot2Label={slot2Label} outcomes={outcomes} blind={blind} showItems={visibility === "total" || viewerIsAdmin} editable={editable} savingBattles={savingBattles} onSaveBattles={(battles) => onSaveBattles?.(match.id, battles)} /></div>
      </DialogContent>
    </Dialog>
  )
}
