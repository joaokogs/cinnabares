import { cn } from "@/lib/utils"

export type RankingView = "players" | "guildas"

const OPTIONS: { value: RankingView; label: string }[] = [
  { value: "players", label: "Players" },
  { value: "guildas", label: "Guildas" },
]

export function ViewToggle({
  view,
  tier,
  period,
}: {
  view: RankingView
  tier?: string
  period?: string
}) {
  return (
    <form method="get" action="/rankings">
      {tier ? <input type="hidden" name="tier" value={tier} /> : null}
      {period && period !== "all" ? <input type="hidden" name="period" value={period} /> : null}
      <fieldset className="inline-flex rounded-lg border border-border/70 bg-card/60 p-1">
        <legend className="sr-only">Tipo de ranking</legend>
        {OPTIONS.map((option) => {
          const active = view === option.value
          return (
            <button
              key={option.value}
              type="submit"
              name="view"
              value={option.value}
              aria-pressed={active}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                active
                  ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          )
        })}
      </fieldset>
    </form>
  )
}