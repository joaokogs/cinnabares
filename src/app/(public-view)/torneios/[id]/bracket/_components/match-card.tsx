"use client"

import { Undo2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { SlotName } from "./slot-name"
import type { Match, Visibility } from "./types"

function MatchCardHeader({
  match,
  visibility,
  adminVisible,
  busy,
  reverting,
  onRevert,
}: {
  match: Match
  visibility: Visibility
  adminVisible: boolean | undefined
  busy: boolean | undefined
  reverting: boolean | undefined
  onRevert?: (matchId: string) => void
}) {
  const isComplete = match.status === "completed"
  const isWinner = isComplete && match.winnerRegistrationId === match.slot1RegistrationId
  const showUndo = adminVisible && isComplete

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 border-b border-border/50 px-3 py-2",
        isWinner && "bg-primary/10",
      )}
    >
      <SlotName
        name={match.slot1Name}
        guildTag={match.slot1GuildTag}
        roster={match.slot1Roster}
        visibility={visibility}
        isWinner={isWinner}
        isComplete={isComplete}
      />
      {showUndo ? (
        <button
          type="button"
          disabled={busy || reverting}
          onClick={() => onRevert?.(match.id)}
          className={cn(
            "relative z-20 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive",
            reverting && "animate-pulse opacity-60",
          )}
          aria-label={`Desfazer resultado de ${match.slot1Name}`}
        >
          <Undo2 className="size-3" />
        </button>
      ) : null}
    </div>
  )
}

function MatchMiddleRow({ match, showMatchup }: { match: Match; showMatchup: boolean }) {
  const isComplete = match.status === "completed"
  const hasBothSlots = Boolean(match.slot1RegistrationId && match.slot2RegistrationId)

  if (isComplete && hasBothSlots) {
    return (
      <div
        role="group"
        className="flex items-center justify-center gap-1.5 border-b border-border/50 px-3 py-1 text-xs text-muted-foreground"
        aria-label={`Placar final ${match.score1} a ${match.score2}`}
      >
        <span className="font-semibold text-foreground">{match.score1}</span>
        <span aria-hidden="true">–</span>
        <span className="font-semibold text-foreground">{match.score2}</span>
      </div>
    )
  }

  if (showMatchup) {
    return (
      <div className="flex items-center justify-center border-b border-border/50 px-3 py-1.5">
        <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
          VS
        </span>
      </div>
    )
  }

  return null
}

function MatchCardFooter({ match, visibility }: { match: Match; visibility: Visibility }) {
  const isComplete = match.status === "completed"
  const isWinner = isComplete && match.winnerRegistrationId === match.slot2RegistrationId
  const showBye = Boolean(match.slot1RegistrationId) && !match.slot2RegistrationId

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-2",
        isWinner && "bg-primary/10",
      )}
    >
      <SlotName
        name={match.slot2Name}
        guildTag={match.slot2GuildTag}
        roster={match.slot2Roster}
        visibility={visibility}
        isWinner={isWinner}
        isComplete={isComplete}
      />
      {showBye ? (
        <span className="text-xs text-muted-foreground">BYE</span>
      ) : null}
    </div>
  )
}

function ResolveActions({
  match,
  adminVisible,
  busy,
  onResolve,
}: {
  match: Match
  adminVisible: boolean | undefined
  busy: boolean | undefined
  onResolve?: (matchId: string, winnerRegistrationId: string) => void
}) {
  const slot1Id = match.slot1RegistrationId
  const slot2Id = match.slot2RegistrationId
  const isComplete = match.status === "completed"

  if (!adminVisible || isComplete || !slot1Id || !slot2Id) return null

  return (
    <div className="flex border-t border-border/50">
      <button
        type="button"
        disabled={busy}
        onClick={() => onResolve?.(match.id, slot1Id)}
        className={cn(
          "relative z-20 flex-1 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10",
          busy && "animate-pulse opacity-60",
        )}
      >
        {match.slot1GuildTag ? `${match.slot1Name} [${match.slot1GuildTag}]` : match.slot1Name}
      </button>
      <div className="w-px bg-border/50" aria-hidden="true" />
      <button
        type="button"
        disabled={busy}
        onClick={() => onResolve?.(match.id, slot2Id)}
        className={cn(
          "relative z-20 flex-1 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10",
          busy && "animate-pulse opacity-60",
        )}
      >
        {match.slot2GuildTag ? `${match.slot2Name} [${match.slot2GuildTag}]` : match.slot2Name}
      </button>
    </div>
  )
}

function MatchupOverlay({
  match,
  showMatchup,
  onViewMatchup,
}: {
  match: Match
  showMatchup: boolean
  onViewMatchup?: (matchId: string) => void
}) {
  if (!showMatchup) return null

  const slot1Label = match.slot1GuildTag ? `${match.slot1Name} [${match.slot1GuildTag}]` : match.slot1Name
  const slot2Label = match.slot2GuildTag ? `${match.slot2Name} [${match.slot2GuildTag}]` : match.slot2Name

  return (
    <button
      type="button"
      onClick={() => onViewMatchup?.(match.id)}
      className="absolute inset-0 z-10 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      aria-label={`Ver confronto de ${slot1Label} contra ${slot2Label}`}
    />
  )
}

export function MatchCard({
  match,
  adminMode,
  visibility,
  finished,
  onResolve,
  onRevert,
  resolving,
  reverting,
  onViewMatchup,
}: {
  match: Match
  adminMode?: boolean
  visibility: Visibility
  finished?: boolean
  onResolve?: (matchId: string, winnerRegistrationId: string) => void
  onRevert?: (matchId: string) => void
  resolving?: boolean
  reverting?: boolean
  onViewMatchup?: (matchId: string) => void
}) {
  const busy = resolving || reverting
  const adminVisible = adminMode && !finished
  const showMatchup =
    Boolean(onViewMatchup) &&
    Boolean(match.slot1GuildTag && match.slot2GuildTag) &&
    Boolean(match.slot1RegistrationId && match.slot2RegistrationId)

  return (
    <div className="relative w-56 shrink-0 rounded-lg border border-border bg-background/60 p-0 text-sm">
      <MatchCardHeader
        match={match}
        visibility={visibility}
        adminVisible={adminVisible}
        busy={busy}
        reverting={reverting}
        onRevert={onRevert}
      />
      <MatchMiddleRow match={match} showMatchup={showMatchup} />
      <MatchCardFooter match={match} visibility={visibility} />
      <ResolveActions
        match={match}
        adminVisible={adminVisible}
        busy={busy}
        onResolve={onResolve}
      />
      <MatchupOverlay match={match} showMatchup={showMatchup} onViewMatchup={onViewMatchup} />
    </div>
  )
}