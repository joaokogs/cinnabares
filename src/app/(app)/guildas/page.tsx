import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Plus, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GuildImage } from "@/components/shared/guild-image"
import { searchGuilds } from "@/lib/guilds/queries"

type GuildsPageProps = {
  searchParams: Promise<{ q?: string }>
}

export const metadata: Metadata = {
  title: "Guildas",
  description: "Explore as guildas da comunidade Cinnabares.",
}

export const dynamic = "force-dynamic"

export default async function GuildsPage({ searchParams }: GuildsPageProps) {
  const { q: query } = await searchParams
  const guilds = await searchGuilds(query ?? "")

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Comunidade</p>
            <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight sm:text-5xl">Guildas</h1>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
              Encontre sua proxima party ou crie um espaco para reunir seus players.
            </p>
          </div>
          <Button asChild>
            <Link href="/guildas/nova"><Plus aria-hidden="true" /> Criar guilda</Link>
          </Button>
        </div>

        <form method="GET" action="/guildas" className="max-w-md">
          <label className="block space-y-2 text-sm font-medium" htmlFor="guild-search">
            <span className="sr-only">Pesquisar guildas</span>
            <input
              id="guild-search"
              name="q"
              type="search"
              defaultValue={query ?? ""}
              placeholder="Pesquisar por nome ou tag..."
              className="flex h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </label>
        </form>

        {guilds.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guilds.map((currentGuild) => (
              <Link key={currentGuild.id} href={`/guildas/${currentGuild.tag}`} className="group focus-visible:outline-none">
                <Card className="h-full border-border/70 bg-card/90 transition-transform group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-accent">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
                        {currentGuild.image ? <GuildImage src={`/api/guilds/${currentGuild.id}/image?path=${encodeURIComponent(currentGuild.image)}`} alt={currentGuild.name} width={48} height={48} className="size-full object-cover" /> : <Shield className="size-5" aria-hidden="true" />}
                      </div>
                      <Badge variant="outline">{currentGuild.tag}</Badge>
                    </div>
                    <CardTitle className="mt-3">{currentGuild.name}</CardTitle>
                    <CardDescription className="line-clamp-3 min-h-15">
                      {currentGuild.description || "Uma nova guilda pronta para receber players."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-accent">
                    <span>Ver guilda</span>
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/70 bg-card/70">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Shield className="size-8 text-accent" aria-hidden="true" />
              <h2 className="font-heading text-xl font-semibold">
                {query ? "Nenhuma guilda encontrada" : "Nenhuma guilda criada ainda"}
              </h2>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                {query ? "Tente pesquisar com outros termos." : "Seja o primeiro a reunir sua comunidade."}
              </p>
              {!query && (
                <Button asChild variant="outline"><Link href="/guildas/nova">Criar primeira guilda</Link></Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
