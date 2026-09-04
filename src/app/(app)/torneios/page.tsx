import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, ChevronRight, Plus, Swords, Users } from "lucide-react"
import { headers } from "next/headers"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { listTournaments } from "@/lib/tournaments/queries"
import { getUserRole } from "@/lib/users/account"

export const metadata: Metadata = { title: "Torneios" }
export const dynamic = "force-dynamic"

const tierLabels = { overused: "OU", underused: "UU", neverused: "NU", doubles: "Doubles", random: "Random" }

export default async function TournamentsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = session ? await getUserRole(session.user.id) : null
  const tournaments = await listTournaments(role === "admin")

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-12 sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Competitivo</p>
            <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight sm:text-5xl">Torneios</h1>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">Encontre uma chave aberta e dispute seu próximo título.</p>
          </div>
          {role === "admin" && <Button asChild variant="outline"><Link href="/torneios/novo"><Plus aria-hidden="true" /> Criar torneio</Link></Button>}
        </div>

        {tournaments.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tournaments.map((currentTournament) => (
              <Link key={currentTournament.id} href={`/torneios/${currentTournament.id}`} className="group focus-visible:outline-none">
                <Card className="h-full border-border/70 bg-card/90 transition-transform group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-accent">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid size-11 place-items-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30"><Swords className="size-5" aria-hidden="true" /></div>
                      <Badge variant={currentTournament.status === "open" ? "default" : currentTournament.status === "active" ? "default" : "outline"}>{currentTournament.status === "open" ? "Inscrições abertas" : currentTournament.status === "draft" ? "Rascunho" : currentTournament.status === "active" ? "Em andamento" : currentTournament.status === "finished" ? "Finalizado" : currentTournament.status === "closed" ? "Inscrições fechadas" : currentTournament.status}</Badge>
                    </div>
                    <CardTitle className="mt-3">{currentTournament.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-12">{currentTournament.description || "Torneio oficial da comunidade."}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{currentTournament.format === "guild" ? "Guildas" : "Individual"}</Badge>
                      {currentTournament.tiers.map((tier) => <Badge key={tier} variant="outline">{tierLabels[tier]}</Badge>)}
                    </div>
                    <span className="flex items-center gap-1 text-muted-foreground"><Users className="size-4" aria-hidden="true" /> {currentTournament.approvedCount}/{currentTournament.slots}</span>
                    <ChevronRight className="size-4 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/70 bg-card/70"><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><CalendarDays className="size-8 text-accent" aria-hidden="true" /><h2 className="font-heading text-xl font-semibold">Nenhum torneio publicado</h2><p className="max-w-md text-sm leading-6 text-muted-foreground">Os próximos torneios aparecerão aqui quando forem abertos.</p></CardContent></Card>
        )}
      </div>
    </main>
  )
}
