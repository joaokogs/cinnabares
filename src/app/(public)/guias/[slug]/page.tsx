import type { Metadata } from "next"
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, User } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { formatGuideDate } from "@/lib/guides/format"
import { getGuideBySlug, getGuideSlugs, getGuides } from "@/lib/guides/source"
import type { GuideSummary } from "@/lib/guides/types"

import { GuideCard } from "../../_components/guides/guide-card"
import { GuideCover } from "../../_components/guides/guide-cover"
import { GuidePortableText } from "../../_components/guides/portable-text"

type GuidePageParams = Promise<{ slug: string }>

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getGuideSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: GuidePageParams
}): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)

  if (!guide) {
    return { title: "Guia não encontrado" }
  }

  return {
    title: guide.title,
    description: guide.excerpt,
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      images: guide.cover.url ? [{ url: guide.cover.url, alt: guide.cover.alt }] : undefined,
      type: "article",
      locale: "pt_BR",
    },
  }
}

function getRelatedGuides(guides: GuideSummary[], current: GuideSummary) {
  return guides
    .filter(
      (guide) =>
        guide.slug !== current.slug &&
        (guide.category.slug === current.category.slug || guide.mode === current.mode)
    )
    .slice(0, 3)
}

export default async function GuidePage({ params }: { params: GuidePageParams }) {
  const { slug } = await params
  const [guide, guides] = await Promise.all([getGuideBySlug(slug), getGuides()])

  if (!guide) {
    notFound()
  }

  const related = getRelatedGuides(guides, guide)
  const currentIndex = guides.findIndex((item) => item.slug === guide.slug)
  const newer = currentIndex > 0 ? guides[currentIndex - 1] : null
  const older =
    currentIndex >= 0 && currentIndex < guides.length - 1
      ? guides[currentIndex + 1]
      : null

  return (
    <main className="flex-1">
      <article>
        <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
          <Link
            href="/guias"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para guias
          </Link>

          <header className="mt-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  guide.mode === "pvp"
                    ? "border-accent/40 bg-accent/10 text-foreground"
                    : "border-emerald-400/40 bg-emerald-400/10 text-foreground"
                }
              >
                {guide.mode === "pvp" ? "PvP" : "PvE"}
              </Badge>
              <Badge variant="outline" className="border-accent/30 bg-accent/10 text-foreground">
                {guide.category.title}
              </Badge>
              {guide.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
              {guide.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {guide.excerpt}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/60 pb-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" aria-hidden="true" />
                {guide.author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatGuideDate(guide.publishedAt)}
              </span>
            </div>
          </header>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <GuideCover
            url={guide.cover.url}
            alt={guide.cover.alt}
            className="aspect-[16/7] w-full rounded-2xl ring-1 ring-foreground/10 sm:aspect-[16/6]"
            sizes="(max-width: 768px) 100vw, 1100px"
            priority
          />
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
          <GuidePortableText body={guide.body} />

          <nav
            aria-label="Navegação entre guias"
            className="mt-12 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-2"
          >
            {newer ? (
              <Link
                href={`/guias/${newer.slug}`}
                className="group flex flex-col gap-1 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                  Mais recente
                </span>
                <span className="font-heading text-sm font-semibold group-hover:text-accent">
                  {newer.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" aria-hidden="true" />
            )}
            {older ? (
              <Link
                href={`/guias/${older.slug}`}
                className="group flex flex-col gap-1 rounded-xl bg-card p-4 text-right ring-1 ring-foreground/10 transition-colors hover:ring-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 sm:col-start-2"
              >
                <span className="inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  Mais antigo
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
                <span className="font-heading text-sm font-semibold group-hover:text-accent">
                  {older.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" aria-hidden="true" />
            )}
          </nav>

          {related.length > 0 ? (
            <section aria-labelledby="guias-relacionados" className="mt-14">
              <h2
                id="guias-relacionados"
                className="font-heading text-xl font-semibold tracking-tight sm:text-2xl"
              >
                Guias relacionados
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <GuideCard key={item.slug} guide={item} />
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </article>
    </main>
  )
}