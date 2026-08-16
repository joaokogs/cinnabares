import { ArrowRight, BookOpen, Flame, Users } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GuideSummary } from "@/lib/guides/types"
import { cn } from "@/lib/utils"

import { FeaturedGuide } from "./guides/featured-guide"
import { GuideModeChips } from "./guides/guide-mode-chips"
import { GuidesEmptyState } from "./guides/guides-empty-state"
import { GuidesList } from "./guides/guides-list"
import { GuidesRail } from "./guides/guides-rail"
import { GuidesStats } from "./guides/guides-stats"
import { Reveal } from "./motion/reveal"

type GuidesShowcaseProps = {
  guides: GuideSummary[]
}

export function GuidesShowcase({ guides }: GuidesShowcaseProps) {
  const [featured, ...rest] = guides
  const recent = rest.slice(0, 3)
  const pveCount = guides.filter((guide) => guide.mode === "pve").length
  const pvpCount = guides.filter((guide) => guide.mode === "pvp").length
  const categories = Array.from(new Set(guides.map((guide) => guide.category.title)))
  const authors = Array.from(new Set(guides.map((guide) => guide.author))).slice(0, 4)

  return (
    <section
      aria-labelledby="guias-titulo"
      className="relative overflow-hidden bg-card/40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] size-[32rem] rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-dots pointer-events-none absolute inset-0 opacity-[0.05]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
            <div className="max-w-2xl">
              <Badge
                variant="outline"
                className="gap-1.5 border-accent/40 bg-accent/10 text-foreground"
              >
                <BookOpen className="size-3" aria-hidden="true" />
                Guias & tutoriais do time Cinnabares
              </Badge>
              <h2
                id="guias-titulo"
                className="mt-5 max-w-xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
              >
                Guias abertos para toda a{" "}
                <span className="text-accent">comunidade PokeMMO</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                O time Cinnabares disponibiliza guias e tutoriais para toda a
                comunidade PokeMMO: farms, caçadas a shinys, times competitivos e
                estratégias, escritos por quem vive o jogo — e gratuitos para
                qualquer treinador.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-accent" aria-hidden="true" />
                  Conteúdo autoral da guilda
                </span>
                {authors.length > 0 ? (
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Flame className="size-4 text-accent" aria-hidden="true" />
                    Escritos por {authors.join(", ")}
                  </span>
                ) : null}
              </div>
            </div>
            <Button asChild size="lg" className="btn-shine relative shrink-0">
              <Link href="/guias">
                Explorar todos os guias
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {guides.length > 0 ? (
          <>
            <Reveal delay={0.05}>
              <GuidesStats
                guideCount={guides.length}
                pveCount={pveCount}
                pvpCount={pvpCount}
                categoryCount={categories.length}
              />
            </Reveal>
            <div
              className={cn(
                "mt-10 grid gap-6",
                recent.length > 0 && "lg:grid-cols-[1.2fr_1fr]"
              )}
            >
              <Reveal>
                <FeaturedGuide guide={featured} />
              </Reveal>
              {recent.length > 0 ? (
                <Reveal delay={0.08} className="grid content-start gap-3">
                  <h3 className="font-heading text-lg font-semibold tracking-tight">
                    Guias recentes
                  </h3>
                  <GuidesList guides={recent} />
                </Reveal>
              ) : null}
            </div>
            <Reveal delay={0.1} className="mt-10">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  Todos os guias
                </h3>
                <Link
                  href="/guias"
                  className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-accent outline-none transition-colors hover:text-accent/80 focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  Ver todos
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
              <GuidesRail guides={guides} />
            </Reveal>
            <Reveal delay={0.05}>
              <GuideModeChips
                pveCount={pveCount}
                pvpCount={pvpCount}
                categories={categories.slice(0, 4)}
              />
            </Reveal>
          </>
        ) : (
          <GuidesEmptyState />
        )}
      </div>
    </section>
  )
}