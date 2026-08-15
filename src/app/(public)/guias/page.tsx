import type { Metadata } from "next"
import { Suspense } from "react"
import { BookOpen, SearchX } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GuideMode, GuideSummary } from "@/lib/guides/types"
import { getGuides } from "@/lib/guides/source"

import { GuideCard } from "../_components/guides/guide-card"
import { GuideFilters } from "../_components/guides/guide-filters"

export const metadata: Metadata = {
  title: "Guias",
  description:
    "Guias da Cinnabares para PokeMMO: farms, caçadas a shinys, times competitivos, tiers e estratégias.",
}

type GuidesSearchParams = Promise<{ q?: string; mode?: string; tag?: string }>

function filterGuides(guides: GuideSummary[], params: Awaited<GuidesSearchParams>) {
  const query = params.q?.trim().toLowerCase() ?? ""
  const mode: GuideMode | null =
    params.mode === "pve" || params.mode === "pvp" ? params.mode : null
  const tag = params.tag?.trim() || null

  return guides.filter((guide) => {
    if (mode && guide.mode !== mode) return false
    if (tag && !guide.tags.includes(tag)) return false
    if (query) {
      const haystack = [
        guide.title,
        guide.excerpt,
        guide.category.title,
        guide.author,
        ...guide.tags,
      ]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: GuidesSearchParams
}) {
  const params = await searchParams
  const guides = await getGuides()

  const filtered = filterGuides(guides, params)
  const allTags = Array.from(new Set(guides.flatMap((guide) => guide.tags))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  )
  const pveCount = guides.filter((guide) => guide.mode === "pve").length
  const pvpCount = guides.filter((guide) => guide.mode === "pvp").length

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,rgba(255,91,79,0.14),transparent_62%)]"
        />
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-8 sm:px-6 sm:pt-14 sm:pb-10">
          <Badge variant="outline" className="gap-1.5 border-accent/40 bg-accent/10 text-foreground">
            <BookOpen className="size-3" aria-hidden="true" />
            Biblioteca da guilda
          </Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Guias para jogar <span className="text-accent">melhor</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Farms, caçadas a shinys, times competitivos, tiers e estratégias — conteúdo
            criado pela própria comunidade para ajudar da primeira canela ao topo do ladder.
          </p>
          <p className="mt-5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{guides.length}</span> guias
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span className="font-semibold text-foreground">{pveCount}</span> PvE
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span className="font-semibold text-foreground">{pvpCount}</span> PvP
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Suspense
          fallback={
            <div aria-hidden="true" className="flex flex-col gap-4">
              <div className="h-9 w-full max-w-sm animate-pulse rounded-lg bg-muted" />
              <div className="h-8 w-full max-w-md animate-pulse rounded-full bg-muted" />
            </div>
          }
        >
          <GuideFilters tags={allTags} />
        </Suspense>

        {filtered.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((guide, index) => (
              <GuideCard key={guide.slug} guide={guide} priority={index < 3} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-heading text-lg font-semibold">
              Nenhum guia encontrado
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Tente ajustar a busca ou limpar os filtros para ver todos os guias
              disponíveis.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/guias">Ver todos os guias</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
