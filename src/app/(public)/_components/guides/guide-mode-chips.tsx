import Link from "next/link"

import { cn } from "@/lib/utils"

type GuideModeChipsProps = {
  pveCount: number
  pvpCount: number
  categories: string[]
}

const chipClass = cn(
  "inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:text-foreground hover:ring-accent/40",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
)

export function GuideModeChips({ pveCount, pvpCount, categories }: GuideModeChipsProps) {
  return (
    <div className="mt-10">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Navegar por modo ou categoria
      </span>
      <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Navegar por modo e categoria">
        <li>
          <Link href="/guias?mode=pve" className={chipClass}>
            PvE
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{pveCount}</span>
          </Link>
        </li>
        <li>
          <Link href="/guias?mode=pvp" className={chipClass}>
            PvP
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{pvpCount}</span>
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category}>
            <Link href={`/guias?q=${encodeURIComponent(category)}`} className={chipClass}>
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
