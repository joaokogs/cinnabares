import { BookOpen, Layers, Shield, Swords } from "lucide-react"

type GuidesStatsProps = {
  guideCount: number
  pveCount: number
  pvpCount: number
  categoryCount: number
}

export function GuidesStats({ guideCount, pveCount, pvpCount, categoryCount }: GuidesStatsProps) {
  const stats = [
    { label: "Guias publicadas", value: guideCount, icon: BookOpen },
    { label: "Categorias", value: categoryCount, icon: Layers },
    { label: "Guias PvE", value: pveCount, icon: Shield },
    { label: "Guias PvP", value: pvpCount, icon: Swords },
  ]

  return (
    <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border/70 ring-1 ring-border/70 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3 bg-background/60 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/20">
            <stat.icon className="size-4" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col-reverse">
            <dt className="truncate text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="font-heading text-2xl font-bold">{stat.value}</dd>
          </span>
        </div>
      ))}
    </dl>
  )
}
