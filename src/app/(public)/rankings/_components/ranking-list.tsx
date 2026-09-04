import Link from "next/link"
import NextImage from "next/image"
import { SearchX, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type RankingRow = {
  id: string
  name: string
  secondary: string | null
  href: string | null
  avatarUrl?: string | null
  total: number
  tournaments: number
}

type RankingView = "players" | "guildas"

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-accent/20 text-accent ring-accent/50"
  if (rank === 2) return "bg-foreground/10 text-foreground ring-foreground/20"
  if (rank === 3) return "bg-orange-500/15 text-orange-500 ring-orange-500/30"
  return "bg-muted text-muted-foreground ring-foreground/10"
}

export function RankingList({
  rows,
  view,
  hasFilters,
}: {
  rows: RankingRow[]
  view: RankingView
  hasFilters: boolean
}) {
  const subject = view === "guildas" ? "guilda" : "player"

  if (rows.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center"
      >
        <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold">Nenhuma {subject} pontuou ainda</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasFilters
            ? "Tente ajustar os filtros de tier e período para encontrar mais resultados."
            : "Ainda não há torneios finalizados com pontos registrados para este ranking."}
        </p>
        {hasFilters ? (
          <Button asChild variant="outline" className="mt-2">
            <Link href={`/rankings?view=${view}`}>Limpar filtros</Link>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <ol aria-label={`Ranking de ${view === "guildas" ? "guildas" : "players"}`} className="space-y-2">
      {rows.map((row, index) => {
        const rank = index + 1
        return (
          <li key={row.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/40 px-4 py-3">
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ring-1",
                rankBadgeClass(rank),
              )}
              aria-label={`${rank}º lugar`}
            >
              {rank}
            </span>
            {view === "players" ? (
              <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/15 text-accent ring-1 ring-accent/20">
                {row.avatarUrl ? (
                  <NextImage
                    src={row.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-5" aria-hidden="true" />
                )}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              {row.href ? (
                <Link
                  href={row.href}
                  className="block rounded transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <span className="block truncate font-medium">{row.name}</span>
                  {row.secondary ? <span className="block truncate text-sm text-muted-foreground">{row.secondary}</span> : null}
                </Link>
              ) : (
                <p>
                  <span className="block truncate font-medium">{row.name}</span>
                  {row.secondary ? <span className="block truncate text-sm text-muted-foreground">{row.secondary}</span> : null}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {row.tournaments} torneio{row.tournaments === 1 ? "" : "s"} pontuado{row.tournaments === 1 ? "" : "s"}
              </p>
            </div>
            <span className="shrink-0 font-heading text-lg font-bold text-accent">{row.total} pts</span>
          </li>
        )
      })}
    </ol>
  )
}
