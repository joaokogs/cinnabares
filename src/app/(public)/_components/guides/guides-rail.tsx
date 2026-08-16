import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import type { GuideSummary } from "@/lib/guides/types"

type GuidesRailProps = {
  guides: GuideSummary[]
}

export function GuidesRail({ guides }: GuidesRailProps) {
  return (
    <div className="scrollbar-none mask-fade-x -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      <ul
        aria-label="Todos os guias da Cinnabares"
        className="flex snap-x snap-mandatory gap-4"
      >
        {guides.map((guide) => (
          <li
            key={guide.slug}
            className="w-[78%] max-w-[19rem] shrink-0 snap-start sm:w-[19rem]"
          >
            <Link
              href={`/guias/${guide.slug}`}
              className="group flex h-full flex-col gap-2.5 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="border-accent/30 bg-accent/10 text-foreground"
                >
                  {guide.category.title}
                </Badge>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </div>
              <span className="line-clamp-2 font-heading text-base leading-snug font-semibold tracking-tight">
                {guide.title}
              </span>
              <span className="mt-auto text-xs text-muted-foreground">
                {guide.author}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}