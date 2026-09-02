import { Trophy } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type PointsRankingItem = {
  id: string
  name: string
  tag?: string | null
  total: number
  tournaments: number
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-accent/20 text-accent ring-accent/50"
  if (rank === 2) return "bg-foreground/10 text-foreground ring-foreground/20"
  if (rank === 3) return "bg-orange-500/15 text-orange-500 ring-orange-500/30"
  return "bg-muted text-muted-foreground ring-foreground/10"
}

export function PointsRankingCard({
  title,
  description,
  items,
  empty,
}: {
  title: string
  description: string
  items: PointsRankingItem[]
  empty: string
}) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-accent" aria-hidden="true" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ol className="space-y-2" aria-label={title}>
            {items.map((item, index) => {
              const rank = index + 1
              return (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ring-1",
                      rankBadgeClass(rank),
                    )}
                    aria-label={`${rank}º lugar`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {item.name}
                      {item.tag ? <span className="text-muted-foreground"> [{item.tag}]</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.tournaments} torneio{item.tournaments === 1 ? "" : "s"} pontuado{item.tournaments === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="shrink-0 font-heading text-lg font-bold text-accent">{item.total} pts</span>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}