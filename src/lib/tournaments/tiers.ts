import type { TournamentTier } from "@/db/schema"

export const TIERS: readonly TournamentTier[] = ["overused", "underused", "neverused", "doubles", "random"]

export type Tier = TournamentTier

export const TIER_LABELS: Readonly<Record<TournamentTier, string>> = {
  overused: "OverUsed",
  underused: "UnderUsed",
  neverused: "NeverUsed",
  doubles: "Doubles",
  random: "Random",
}

export const PERIODS = [
  { value: "all", label: "Todo o período" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
] as const

export type PeriodValue = (typeof PERIODS)[number]["value"]