import type { Metadata } from "next"
import { Medal } from "lucide-react"

import { POINTS_RULE_LABEL } from "@/lib/tournaments/points"
import {
  getGuildPointsRanking,
  getPlayerPointsRanking,
  type GuildPointsRankingEntry,
  type PlayerPointsRankingEntry,
  type StatsFilters,
} from "@/lib/tournaments/stats"
import { TIERS } from "@/lib/tournaments/tiers"

import { RankingsFilters } from "@/app/(public)/rankings/_components/rankings-filters"
import { RankingList, type RankingRow } from "@/app/(public)/rankings/_components/ranking-list"
import { ViewToggle, type RankingView } from "@/app/(public)/rankings/_components/view-toggle"

export const metadata: Metadata = {
  title: "Rankings",
  description: "Ranking de pontos por colocação em torneios de players e guildas da Cinnabares.",
}

export const dynamic = "force-dynamic"

type RankingsSearchParams = Promise<{ view?: string; tier?: string; period?: string }>

function parseView(value: string | undefined): RankingView {
  return value === "guildas" ? "guildas" : "players"
}

function isTier(value: string | undefined): value is (typeof TIERS)[number] {
  return !!value && (TIERS as readonly string[]).includes(value)
}

function parsePeriod(value: string | undefined): Date | undefined {
  if (!value || value === "all") return undefined
  const days = Number(value)
  if (Number.isNaN(days) || days <= 0) return undefined
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  from.setDate(from.getDate() - days)
  return from
}

function toPlayerRows(entries: PlayerPointsRankingEntry[]): RankingRow[] {
  return entries.map((entry) => ({
    id: entry.playerId,
    name: entry.name,
    secondary: entry.username ? `@${entry.username}` : null,
    href: entry.username ? `/players/${encodeURIComponent(entry.username)}` : null,
    avatarUrl: entry.image && entry.username
      ? `/api/players/${encodeURIComponent(entry.username)}/avatar`
      : null,
    total: entry.total,
    tournaments: entry.tournaments,
  }))
}

function toGuildRows(entries: GuildPointsRankingEntry[]): RankingRow[] {
  return entries.map((entry) => ({
    id: entry.guildId,
    name: entry.name,
    secondary: entry.tag ? `[${entry.tag}]` : null,
    href: entry.tag ? `/guildas/${encodeURIComponent(entry.tag)}` : null,
    total: entry.total,
    tournaments: entry.tournaments,
  }))
}

export default async function RankingsPage({ searchParams }: { searchParams: RankingsSearchParams }) {
  const params = await searchParams
  const view = parseView(params.view)

  const filters: StatsFilters = {}
  if (isTier(params.tier)) filters.tier = params.tier
  const from = parsePeriod(params.period)
  if (from) filters.from = from

  const rows =
    view === "guildas"
      ? toGuildRows(await getGuildPointsRanking(filters))
      : toPlayerRows(await getPlayerPointsRanking(filters))

  const hasFilters = Boolean(params.tier) || Boolean(params.period && params.period !== "all")

  return (
    <main className="relative min-h-screen flex-1 overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" />
      <section className="relative mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:py-10">
        <header className="flex flex-col gap-5 border-b border-border/60 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">Leaderboard</p>
            <h1 className="mt-2 flex items-center gap-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              <Medal className="size-7 text-accent" aria-hidden="true" /> Ranking competitivo
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-right">
            Acompanhe quem está no topo da comunidade. Os pontos vêm das colocações em torneios finalizados e podem ser
            filtrados por tier e período.
          </p>
        </header>

        <div className="mt-7 flex flex-col gap-4">
          <ViewToggle view={view} tier={params.tier} period={params.period} />
          <RankingsFilters view={view} tier={params.tier} period={params.period} />
        </div>

        <div className="mt-8">
          <RankingList rows={rows} view={view} hasFilters={hasFilters} />
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          Pontuação por colocação: {POINTS_RULE_LABEL}.
        </p>
      </section>
    </main>
  )
}
