"use client"

import { EyeOff, Trophy } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
}

type MatchupDialogProps = {
  match: MatchupMatch | null
  visibility: Visibility
  open: boolean
  onOpenChange: (open: boolean) => void
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
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
      <Trophy className="size-3" aria-hidden="true" /> Vencedor
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      Perdedor
    </span>
  )
}

function GuildBox({ label, outcome, isPending }: { label: string; outcome: Outcome; isPending: boolean }) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-lg border px-3 py-2",
        outcome === "winner" ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/50",
      )}
    >
      <p className={cn("truncate text-sm font-semibold", outcome === "winner" && "text-primary")}>{label}</p>
      <div className="mt-1.5">
        {outcome ? (
          <OutcomeBadge kind={outcome} />
        ) : isPending ? (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Aguardando</span>
        ) : null}
      </div>
    </div>
  )
}

function TeamOrder({
  name,
  guildTag,
  roster,
  hidden,
  outcome,
}: {
  name: string
  guildTag: string | null
  roster: VisibleRosterEntry[]
  hidden: boolean
  outcome: Outcome
}) {
  const label = slotLabel(name, guildTag)

  return (
    <section
      className={cn(
        "rounded-lg border p-4",
        outcome === "winner" ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/50",
      )}
    >
      <h3 className="mb-3 truncate font-heading text-sm font-semibold">{label}</h3>
      {hidden ? (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <EyeOff className="size-4 shrink-0" aria-hidden="true" />
          Escalação oculta neste torneio (modalidade blind).
        </p>
      ) : roster.length > 0 ? (
        <ol className="list-none space-y-3">
          {roster.map((entry, i) => (
            <li key={`${entry.playerId}-${i}`} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{entry.playerName}</p>
                  <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {TIER_LABELS[entry.tier] ?? entry.tier}
                  </span>
                </div>
                {entry.team && entry.team.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {entry.team.map((pokemon, j) => (
                      <span
                        key={`${pokemon.name}-${j}`}
                        title={capitalize(pokemon.name)}
                        className="grid size-7 place-items-center rounded-md border border-border/60 bg-background/60"
                      >
                        <RosterIcon name={pokemon.name} kind="pokemon" className="size-5" />
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem time definido</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">Sem escalação registrada</p>
      )}
    </section>
  )
}

function ScoreBoard({ completed, score1, score2 }: { completed: boolean; score1: number; score2: number }) {
  if (completed) {
    return (
      <>
        <span className="text-2xl font-bold tabular-nums">{score1}</span>
        <span className="text-sm text-muted-foreground" aria-hidden="true">–</span>
        <span className="text-2xl font-bold tabular-nums">{score2}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Melhor de 5</span>
      </>
    )
  }
  return (
    <span className="rounded-full border border-accent/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
      VS · Melhor de 5
    </span>
  )
}

function MatchupBody({
  match,
  completed,
  blind,
  slot1Label,
  slot2Label,
  slot1Outcome,
  slot2Outcome,
}: {
  match: MatchupMatch
  completed: boolean
  blind: boolean
  slot1Label: string
  slot2Label: string
  slot1Outcome: Outcome
  slot2Outcome: Outcome
}) {
  return (
    <div className="max-h-[65vh] overflow-y-auto pr-1">
      <div className="mb-4 flex items-center justify-center gap-3 rounded-lg border border-border/60 bg-background/50 px-4 py-3">
        <ScoreBoard completed={completed} score1={match.score1} score2={match.score2} />
      </div>

      <div className="mb-5 flex items-stretch gap-2">
        <GuildBox label={slot1Label} outcome={slot1Outcome} isPending={!completed} />
        <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground" aria-hidden="true">vs</div>
        <GuildBox label={slot2Label} outcome={slot2Outcome} isPending={!completed} />
      </div>

      {blind ? (
        <p className="mb-5 flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <EyeOff className="size-4 shrink-0" aria-hidden="true" />
          Escalação oculta: este torneio é blind, então os times não são exibidos.
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <TeamOrder
          name={match.slot1Name}
          guildTag={match.slot1GuildTag}
          roster={match.slot1Roster}
          hidden={blind}
          outcome={slot1Outcome}
        />
        <TeamOrder
          name={match.slot2Name}
          guildTag={match.slot2GuildTag}
          roster={match.slot2Roster}
          hidden={blind}
          outcome={slot2Outcome}
        />
      </div>
    </div>
  )
}

export function MatchupDialog({ match, visibility, open, onOpenChange }: MatchupDialogProps) {
  const slot1Label = match ? slotLabel(match.slot1Name, match.slot1GuildTag) : ""
  const slot2Label = match ? slotLabel(match.slot2Name, match.slot2GuildTag) : ""
  const completed = match?.status === "completed"
  const blind = visibility === "blind"
  const outcomes = matchOutcomes(match)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ordem de luta</DialogTitle>
          {match ? (
            <DialogDescription>
              {slot1Label} contra {slot2Label} — série melhor de 5
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {match ? (
          <MatchupBody
            match={match}
            completed={completed}
            blind={blind}
            slot1Label={slot1Label}
            slot2Label={slot2Label}
            slot1Outcome={outcomes.slot1}
            slot2Outcome={outcomes.slot2}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}