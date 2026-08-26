import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { db } from "@/db"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { canViewTournamentParticipants } from "@/lib/tournaments/auth"
import { getTournament } from "@/lib/tournaments/queries"
import { BracketView } from "./_components/bracket-view"

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const currentTournament = await getTournament(id)
  return { title: currentTournament ? `Chave — ${currentTournament.name}` : "Chave do Torneio" }
}

export default async function BracketPage({ params }: PageProps) {
  const { id } = await params
  const currentTournament = await getTournament(id)
  if (!currentTournament) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !await canViewTournamentParticipants(id, session.user.id)) notFound()

  const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  const isAdmin = account?.role === "admin"

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-14">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href={`/torneios/${id}`}>
            <ArrowLeft aria-hidden="true" /> Voltar ao torneio
          </Link>
        </Button>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Chave</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{currentTournament.name}</h1>
        </div>
        <BracketView tournamentId={id} adminMode={isAdmin} />
      </div>
    </main>
  )
}
