"use client"

import { Trophy } from "lucide-react"

import { cn } from "@/lib/utils"

export function SlotName({
  name,
  guildTag,
  isWinner,
  isComplete,
}: {
  name: string
  guildTag: string | null
  isWinner: boolean
  isComplete: boolean
}) {
  const label = guildTag ? `${name} [${guildTag}]` : name
  return (
    <div className="min-w-0 flex-1">
      <span className={cn("flex items-center gap-1.5", isWinner && "font-semibold text-primary")}>
        <span className="truncate">{label}</span>
        {isWinner && isComplete ? <Trophy className="size-3.5 shrink-0 text-primary" aria-label="Vencedor" /> : null}
      </span>
    </div>
  )
}
