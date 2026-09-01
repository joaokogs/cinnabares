import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { SearchX, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { searchGuilds } from "@/lib/guilds/queries"
import { searchPlayers, type PlayerStatus } from "@/lib/users/queries"

import { PlayerCard } from "../_components/players/player-card"
import { PlayerFilters } from "../_components/players/player-filters"
import { PlayerPagination } from "../_components/players/player-pagination"

export const metadata: Metadata = {
  title: "Players",
  description: "Explore os players da comunidade Cinnabares por nome, usuário ou guilda.",
}

export const dynamic = "force-dynamic"

type PlayersSearchParams = Promise<{
  q?: string
  guild?: string
  status?: string
  page?: string
}>

function parseStatus(value?: string): PlayerStatus {
  return value === "member" || value === "solo" ? value : "all"
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: PlayersSearchParams
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ""
  const guild = params.guild?.trim() || null
  const status = parseStatus(params.status)
  const page = Number(params.page) || 1

  const [result, guilds] = await Promise.all([
    searchPlayers({ query, guildTag: guild, status, page }),
    searchGuilds(""),
  ])

  const guildOptions = guilds
    .map((current) => ({ tag: current.tag, name: current.name }))
    .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"))
  const hasFilters = Boolean(query || guild || status !== "all")
  const isFilteredEmpty = result.players.length === 0 && hasFilters

  return (
    <main className="relative min-h-screen flex-1 overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" />
      <section className="relative mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
        <header className="flex flex-col gap-2 border-b border-border/60 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">Diretório</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Players</h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-right">
            Encontre jogadores por nome, usuário ou guilda.
          </p>
        </header>

        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="mt-7 h-52 rounded-2xl border border-border/60 bg-card/60"
            />
          }
        >
          <PlayerFilters guilds={guildOptions} />
        </Suspense>

        <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{result.total}</span>{" "}
                {result.total === 1 ? "player encontrado" : "players encontrados"}
              </p>
              {hasFilters ? <span className="text-xs text-muted-foreground">Filtros ativos</span> : null}
            </div>

            {result.players.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {result.players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            ) : isFilteredEmpty ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
                <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
                <h2 className="font-heading text-lg font-semibold">Nenhum player encontrado</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Tente ajustar a busca ou limpar os filtros para ver todos os players disponíveis.
                </p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/players">Limpar filtros</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
                <Users className="size-8 text-muted-foreground" aria-hidden="true" />
                <h2 className="font-heading text-lg font-semibold">Nenhum player ainda</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  A comunidade está começando a chegar. Volte em breve para conhecer os primeiros players.
                </p>
              </div>
            )}

            {result.players.length > 0 ? (
              <PlayerPagination
                page={result.page}
                totalPages={result.totalPages}
                params={{ q: query, guild: guild ?? undefined, status }}
              />
            ) : null}
        </div>
      </section>
    </main>
  )
}
