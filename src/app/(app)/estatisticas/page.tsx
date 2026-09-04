import type { Metadata } from "next"
import { BarChart3, CalendarDays, Crown, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { POINTS_RULE_LABEL } from "@/lib/tournaments/points"
import { computeChampionPokemonItemUsage, titleCase } from "@/lib/tournaments/stats-core"
import { getFinishedChampionTournaments, getGuildPointsRanking, getPlayerPointsRanking, type StatsFilters } from "@/lib/tournaments/stats"
import { ItemSprite } from "./_components/item-sprite"
import { PokemonSprite } from "./_components/pokemon-sprite"
import { StatsFiltersForm, TIERS, TIER_LABELS, type Tier } from "./_components/stats-filters"
import { PointsRankingCard } from "./_components/points-ranking"

export const metadata: Metadata = {
  title: "Estatísticas de torneios",
}

export const dynamic = "force-dynamic"

type SearchParams = { tier?: string; format?: string; period?: string }

function buildStatsFilters(params: SearchParams): StatsFilters {
  const filters: StatsFilters = {}
  if (params.tier && (TIERS as readonly string[]).includes(params.tier)) {
    filters.tier = params.tier as Tier
  }
  if (params.format === "guild") {
    filters.format = params.format
  }
  if (params.period && params.period !== "all") {
    const days = Number(params.period)
    if (!Number.isNaN(days) && days > 0) {
      const from = new Date()
      from.setHours(0, 0, 0, 0)
      from.setDate(from.getDate() - days)
      filters.from = from
    }
  }
  return filters
}

function formatDate(value: Date | string | null): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function championLabel(champion: {
  format: "individual" | "guild"
  championUserName: string | null
  championUserUsername: string | null
  championGuildName: string | null
  championGuildTag: string | null
}): string {
  if (champion.format === "guild") {
    return champion.championGuildName
      ? `${champion.championGuildName}${champion.championGuildTag ? ` [${champion.championGuildTag}]` : ""}`
      : "Guilda"
  }
  return champion.championUserName ?? champion.championUserUsername ?? "Player"
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const filters = buildStatsFilters(params)

  const tournaments = await getFinishedChampionTournaments(filters)
  const topPokemon = computeChampionPokemonItemUsage(tournaments, { limit: 6, itemsLimit: 3 })

  const showGuildRanking = filters.format === "guild"
  const playerRanking = showGuildRanking ? null : await getPlayerPointsRanking(filters)
  const guildRanking = showGuildRanking ? await getGuildPointsRanking(filters) : null

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Painel competitivo</p>
          <h1 className="mt-2 flex items-center gap-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            <BarChart3 className="size-7 text-accent" aria-hidden="true" /> Estatísticas de torneios
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ranking de pontos por colocação, Pokémon mais usados em times campeões e torneios finalizados. Use os
            filtros para refinar por tier, formato e período.
          </p>
        </div>

        <StatsFiltersForm current={{ tier: params.tier, format: params.format, period: params.period }} />

        {playerRanking ? (
          <PointsRankingCard
            title="Ranking de pontos — Players"
            description={`Pontos de colocação nos torneios individuais finalizados (${POINTS_RULE_LABEL}).`}
            items={playerRanking.map((entry) => ({ id: entry.playerId, name: entry.name, total: entry.total, tournaments: entry.tournaments }))}
            empty="Nenhum player pontuou com os filtros atuais."
          />
        ) : null}
        {guildRanking ? (
          <PointsRankingCard
            title="Ranking de pontos — Guildas"
            description={`Pontos de colocação nos torneios de guilda finalizados (${POINTS_RULE_LABEL}). A guilda recebe o valor total por inscrição.`}
            items={guildRanking.map((entry) => ({ id: entry.guildId, name: entry.name, tag: entry.tag, total: entry.total, tournaments: entry.tournaments }))}
            empty="Nenhuma guilda pontuou com os filtros atuais."
          />
        ) : null}

        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-accent" aria-hidden="true" /> Pokémon mais usados em times campeões
            </CardTitle>
            <CardDescription>Top 6 por número de aparições em times campeões, com seus itens mais equipados.</CardDescription>
          </CardHeader>
          <CardContent>
            {topPokemon.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado com os filtros atuais.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {topPokemon.map((pokemon) => (
                  <li
                    key={pokemon.name}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <PokemonSprite name={pokemon.name} size={48} />
                      <div className="min-w-0">
                        <p className="truncate font-heading text-base font-semibold">{titleCase(pokemon.name)}</p>
                        <p className="text-xs text-muted-foreground">
                          {pokemon.uses} uso{pokemon.uses === 1 ? "" : "s"} em times campeões
                        </p>
                      </div>
                    </div>
                    {pokemon.items.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {pokemon.items.map((item) => (
                          <span
                            key={item.name}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-xs"
                            title={`${titleCase(item.name)}: ${item.count} uso${item.count === 1 ? "" : "s"}`}
                          >
                            <ItemSprite name={item.name} size={18} />
                            <span className="font-medium">{titleCase(item.name)}</span>
                            <span className="text-muted-foreground">×{item.count}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sem itens registrados.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-accent" aria-hidden="true" /> Torneios finalizados
            </CardTitle>
            <CardDescription>{tournaments.length} torneio{tournaments.length === 1 ? "" : "s"} contemplado{tournaments.length === 1 ? "" : "s"}.</CardDescription>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum torneio finalizado com os filtros atuais.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {tournaments.map((tournament) => (
                  <li key={tournament.tournamentId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{tournament.tournamentName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline">{tournament.format === "guild" ? "Guilda" : "Individual"}</Badge>
                        {tournament.tiers.map((tier) => (
                          <Badge key={tier} variant="secondary">
                            {TIER_LABELS[tier as Tier] ?? tier}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Crown className="size-4 text-accent" aria-hidden="true" />
                        <span className="truncate">{championLabel(tournament)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="size-4" aria-hidden="true" />
                        {formatDate(tournament.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
