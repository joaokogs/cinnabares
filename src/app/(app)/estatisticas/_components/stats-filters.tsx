import { Button } from "@/components/ui/button"
import Link from "next/link"

export const TIERS = ["overused", "underused", "neverused", "doubles", "random"] as const
export type Tier = (typeof TIERS)[number]

export const TIER_LABELS: Record<Tier, string> = {
  overused: "OverUsed",
  underused: "UnderUsed",
  neverused: "NeverUsed",
  doubles: "Doubles",
  random: "Random",
}

export const PERIODS = [
  { value: "all", label: "Todo o período" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
] as const

type Current = { tier?: string; format?: string; period?: string }

export function StatsFiltersForm({ current }: { current: Current }) {
  return (
    <form
      method="get"
      action="/estatisticas"
      className="grid gap-4 rounded-xl border border-border/70 bg-card/60 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
    >
      <label className="space-y-1.5 text-sm font-medium">
        <span className="block">Tier</span>
        <select
          name="tier"
          defaultValue={current.tier ?? ""}
          className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="">Todos os tiers</option>
          {TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {TIER_LABELS[tier]}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1.5 text-sm font-medium">
        <span className="block">Formato</span>
        <select
          name="format"
          defaultValue={current.format ?? ""}
          className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="">Todos os formatos</option>
          <option value="individual">Individual</option>
          <option value="guild">Guilda</option>
        </select>
      </label>

      <label className="space-y-1.5 text-sm font-medium">
        <span className="block">Período</span>
        <select
          name="period"
          defaultValue={current.period ?? "all"}
          className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {PERIODS.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/estatisticas">Limpar</Link>
        </Button>
      </div>
    </form>
  )
}
