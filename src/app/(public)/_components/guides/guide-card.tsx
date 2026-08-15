import { CalendarDays, User } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { formatGuideDate } from "@/lib/guides/format"
import type { GuideSummary } from "@/lib/guides/types"

import { GuideCover } from "./guide-cover"

type GuideCardProps = {
  guide: GuideSummary
  priority?: boolean
}

export function GuideCard({ guide, priority = false }: GuideCardProps) {
  return (
    <article className="group flex overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-xl hover:shadow-black/25">
      <Link
        href={`/guias/${guide.slug}`}
        className="flex flex-1 flex-col rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <GuideCover
          url={guide.cover.url}
          alt={guide.cover.alt}
          mode={guide.mode}
          className="aspect-video"
          priority={priority}
        />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-accent/30 bg-accent/10 text-foreground">
              {guide.category.title}
            </Badge>
            {guide.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
          <h3 className="font-heading text-lg leading-snug font-semibold tracking-tight group-hover:text-accent">
            {guide.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {guide.excerpt}
          </p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {formatGuideDate(guide.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="size-3.5" aria-hidden="true" />
              {guide.author}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
