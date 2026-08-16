import { ArrowUpRight, CalendarDays } from "lucide-react"
import Link from "next/link"

import { formatGuideDate } from "@/lib/guides/format"
import type { GuideSummary } from "@/lib/guides/types"

type GuidesListProps = {
  guides: GuideSummary[]
}

export function GuidesList({ guides }: GuidesListProps) {
  return (
    <ol className="flex flex-col divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-foreground/10">
      {guides.map((guide, index) => (
        <li key={guide.slug}>
          <Link
            href={`/guias/${guide.slug}`}
            className="group flex items-center gap-4 rounded-2xl p-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-accent/70 sm:gap-5 sm:p-5"
          >
            <span
              aria-hidden="true"
              className="font-mono text-sm font-bold text-accent/70 tabular-nums transition-colors group-hover:text-accent sm:text-base"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-semibold text-accent ring-1 ring-accent/25">
                  {guide.category.title}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  {formatGuideDate(guide.publishedAt)}
                </span>
              </span>
              <span className="font-heading text-base leading-snug font-semibold tracking-tight text-foreground group-hover:text-accent sm:text-lg">
                {guide.title}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {guide.author}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
            />
          </Link>
        </li>
      ))}
    </ol>
  )
}