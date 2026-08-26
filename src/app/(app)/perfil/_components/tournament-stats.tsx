import { Swords, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPlayerStats } from "@/lib/tournaments/stats"

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

export async function PlayerTournamentStats({ userId }: { userId: string }) {
  const { history, favorite } = await getPlayerStats(userId)

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-accent" aria-hidden="true" /> Histórico de torneios
          </CardTitle>
          <CardDescription>Torneios que você participou e seus resultados.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não participou de torneios.</p>
          ) : (
            <ul className="divide-y divide-border/60">
                {history.map((item) => (
                  <li key={item.registrationId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.tournamentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.format === "guild" ? "Guilda" : "Individual"} · {formatDate(item.createdAt)}
                      {item.tiers.length > 0
                        ? ` · ${item.tiers.map((tier) => TIER_LABELS[tier] ?? tier).join(", ")}`
                        : ""}
                    </p>
                  </div>
                  {item.result === "champion" ? (
                    <Badge className="bg-accent/15 text-accent">
                      <Trophy className="mr-1 size-3" aria-hidden="true" /> Campeão · {item.placementLabel}
                    </Badge>
                  ) : item.result === "pending" ? (
                    <Badge variant="outline">Inscrição pendente</Badge>
                  ) : item.result === "rejected" ? (
                    <Badge variant="destructive">Inscrição recusada</Badge>
                  ) : item.result === "eliminated" ? (
                    <Badge variant="secondary" aria-label={`Colocação ${item.placementLabel}`}>
                      {item.placementLabel}
                    </Badge>
                  ) : item.result === "in_progress" ? (
                    <Badge variant="secondary">Em andamento</Badge>
                  ) : item.viaGuild ? (
                    <Badge variant="outline">Via guilda</Badge>
                  ) : (
                    <Badge variant="secondary">Participou</Badge>
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
            <Swords className="size-5 text-accent" aria-hidden="true" /> Pokémon mais usados
          </CardTitle>
          <CardDescription>Times registrados nos torneios que você participou.</CardDescription>
        </CardHeader>
        <CardContent>
          {favorite.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem times registrados ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favorite.map((pokemon) => (
                <span
                  key={pokemon.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/40 px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{pokemon.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {pokemon.uses}x · {pokemon.tournaments} torneio{pokemon.tournaments === 1 ? "" : "s"}
                  </span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
