import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PERIODS, TIERS, TIER_LABELS } from "@/lib/tournaments/tiers"

import type { RankingView } from "./view-toggle"

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

export function RankingsFilters({
  view,
  tier,
  period,
}: {
  view: RankingView
  tier?: string
  period?: string
}) {
  return (
    <form
      method="get"
      action="/rankings"
      className="grid gap-4 rounded-xl border border-border/70 bg-card/60 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <input type="hidden" name="view" value={view} />
      <label className="space-y-1.5 text-sm font-medium">
        <span className="block">Tier</span>
        <select name="tier" defaultValue={tier ?? ""} className={selectClass}>
          <option value="">Todos os tiers</option>
          {TIERS.map((current) => (
            <option key={current} value={current}>
              {TIER_LABELS[current]}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1.5 text-sm font-medium">
        <span className="block">Período</span>
        <select name="period" defaultValue={period ?? "all"} className={selectClass}>
          {PERIODS.map((current) => (
            <option key={current.value} value={current.value}>
              {current.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href={`/rankings?view=${view}`}>Limpar</Link>
        </Button>
      </div>
    </form>
  )
}