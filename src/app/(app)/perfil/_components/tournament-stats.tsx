import Link from "next/link"
import { ArrowUpRight, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { pointsForResult } from "@/lib/tournaments/points"
import type { PlayerTournamentResult } from "@/lib/tournaments/stats"

const TIER_LABELS: Record<string, string> = {
  overused: "OverUsed",
  underused: "UnderUsed",
  neverused: "NeverUsed",
  doubles: "Doubles",
  random: "Random",
}

function formatDate(value: Date | string | null): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
}

function ResultBadge({ item }: { item: PlayerTournamentResult }) {
  const resultBadge = item.result === "champion" ? (
    <Badge className="bg-accent/15 text-accent"><Trophy className="mr-1 size-3" aria-hidden="true" /> Campeão · {item.placementLabel}</Badge>
  ) : item.result === "pending" ? (
    <Badge variant="outline">Inscrição pendente</Badge>
  ) : item.result === "rejected" ? (
    <Badge variant="destructive">Inscrição recusada</Badge>
  ) : item.result === "in_progress" ? (
    <Badge variant="secondary">Em andamento</Badge>
  ) : item.result === "eliminated" ? (
    <Badge variant="secondary" aria-label={`Colocação ${item.placementLabel}`}>{item.placementLabel}</Badge>
  ) : (
    <Badge variant="secondary">Participou</Badge>
  )

  return <>{resultBadge}{item.viaGuild ? <Badge variant="outline">Via guilda</Badge> : null}</>
}

export function PlayerTournamentStats({ history }: { history: PlayerTournamentResult[] }) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-accent" aria-hidden="true" /> Histórico de torneios
        </CardTitle>
        <CardDescription>Veja a colocação e abra os detalhes de cada torneio.</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este player ainda não participou de torneios.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {history.map((item) => (
              <li key={item.registrationId}>
                <Link href={`/torneios/${item.tournamentId}`} className="group block h-full focus-visible:outline-none">
                  <Card className="h-full border-border/70 bg-background/40 transition-colors group-hover:border-accent/40 group-hover:bg-accent/5 group-focus-visible:ring-2 group-focus-visible:ring-accent">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">{item.tournamentName}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.format === "guild" ? "Guilda" : "Individual"} · {formatDate(item.createdAt)}
                          </CardDescription>
                        </div>
                        <ArrowUpRight className="size-4 shrink-0 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {item.tiers.map((tier) => <Badge key={tier} variant="outline">{TIER_LABELS[tier] ?? tier}</Badge>)}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Colocação</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {pointsForResult(item) > 0 ? (
                            <Badge variant="outline" className="text-accent">+{pointsForResult(item)} pts</Badge>
                          ) : null}
                          <ResultBadge item={item} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
