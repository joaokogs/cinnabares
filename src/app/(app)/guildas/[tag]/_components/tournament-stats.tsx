import { Swords, Trophy, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getGuildStats } from "@/lib/tournaments/stats"

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

export async function GuildTournamentStats({ guildId }: { guildId: string }) {
  const { history, members } = await getGuildStats(guildId)

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-accent" aria-hidden="true" /> Histórico de torneios
          </CardTitle>
          <CardDescription>Torneios disputados pela guilda e seus resultados.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">A guilda ainda não participou de torneios.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {history.map((item) => (
                <li key={item.tournamentId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
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
                      <Trophy className="mr-1 size-3" aria-hidden="true" /> Campeã · {item.placementLabel}
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
            <Users className="size-5 text-accent" aria-hidden="true" /> Pokémon favoritos por membro
          </CardTitle>
          <CardDescription>Times mais usados por cada membro nos torneios da guilda.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>
          ) : (
            members.map((member) => (
              <div key={member.userId} className="rounded-xl border border-border/70 bg-background/40 p-3">
                <p className="truncate font-medium">{member.name ?? member.username ?? "Player"}</p>
                {member.top.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">Sem times registrados.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {member.top.map((pokemon) => (
                      <span
                        key={pokemon.name}
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-xs"
                      >
                        <Swords className="size-3 text-accent" aria-hidden="true" />
                        <span className="font-medium">{pokemon.name}</span>
                        <span className="text-muted-foreground">{pokemon.uses}x</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
