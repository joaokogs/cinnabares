"use client"

import { Trophy } from "lucide-react"

import type { VisibleRosterEntry } from "@/lib/tournaments/roster"
import { TIER_LABELS } from "@/lib/tournaments/tiers"
import { cn } from "@/lib/utils"
import type { Visibility } from "./types"

export function SlotName({
  name,
  guildTag,
  roster,
  visibility,
  isWinner,
  isComplete,
}: {
  name: string
  guildTag: string | null
  roster: VisibleRosterEntry[]
  visibility: Visibility
  isWinner: boolean
  isComplete: boolean
}) {
  const label = guildTag ? `${name} [${guildTag}]` : name
  const showPlayers = Boolean(guildTag) && visibility !== "blind" && roster.length > 0

  return (
    <div className="min-w-0 flex-1">
      <span className={cn("flex items-center gap-1.5", isWinner && "font-semibold text-primary")}>
        <span className="truncate">{label}</span>
        {isWinner && isComplete ? <Trophy className="size-3.5 shrink-0 text-primary" aria-label="Vencedor" /> : null}
      </span>
      {showPlayers ? (
        <ul className="mt-0.5 space-y-0.5">
          {roster.map((entry, i) => (
            <li key={`${entry.playerId}-${i}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">{entry.playerName}</span>
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide">{TIER_LABELS[entry.tier] ?? entry.tier}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}