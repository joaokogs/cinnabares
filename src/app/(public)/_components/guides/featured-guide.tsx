import { ArrowRight, CalendarDays, User } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatGuideDate } from "@/lib/guides/format"
import type { GuideSummary } from "@/lib/guides/types"

import { GuideCover } from "./guide-cover"

type FeaturedGuideProps = {
  guide: GuideSummary
}

export function FeaturedGuide({ guide }: FeaturedGuideProps) {
  return (
    <article className="group grid overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-xl hover:shadow-black/25 lg:grid-cols-[1.15fr_1fr]">
      <GuideCover
        url={guide.cover.url}
        alt={guide.cover.alt}
        mode={guide.mode}
        className="aspect-video lg:h-full"
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      <div className="flex flex-col gap-4 p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-foreground">
            {guide.category.title}
          </Badge>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-accent/30">
            Em destaque
          </span>
        </div>
        <h3 className="font-heading text-2xl leading-snug font-semibold tracking-tight group-hover:text-accent sm:text-[1.7rem]">
          <Link
            href={`/guias/${guide.slug}`}
            className="rounded outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {guide.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {guide.excerpt}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatGuideDate(guide.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User className="size-3.5" aria-hidden="true" />
            {guide.author}
          </span>
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href={`/guias/${guide.slug}`}>
            Ler guia completo
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  )
}
