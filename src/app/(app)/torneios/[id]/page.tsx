import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, ExternalLink, Eye, Shield, Swords, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/db"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserGuild } from "@/lib/guilds/queries"
import { getBracketByTournamentId, getTournament, getUserTournamentRegistration } from "@/lib/tournaments/queries"
import { RegistrationForm } from "../_components/registration-form"
import { ParticipantsList } from "../_components/participants-list"
import { TournamentControls } from "../_components/tournament-controls"

type PageProps = { params: Promise<{ id: string }> }
const tierLabels = { overused: "OverUsed", underused: "UnderUsed", neverused: "NeverUsed", doubles: "Doubles", random: "Random" }
const visibilityLabels = { blind: "Às cegas", partial: "Parcial", total: "Total" }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const currentTournament = await getTournament(id)
  return { title: currentTournament?.name ?? "Torneio" }
}

export default async function TournamentPage({ params }: PageProps) {
  const { id } = await params
  const [currentTournament, session] = await Promise.all([getTournament(id), auth.api.getSession({ headers: await headers() })])
  if (!currentTournament) notFound()
  if (!session) return null

  const [currentUser, currentGuild, registration, existingBracket] = await Promise.all([
    db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1),
    getUserGuild(session.user.id),
    getUserTournamentRegistration(id, session.user.id),
    getBracketByTournamentId(id),
  ])
  const isAdmin = currentUser[0]?.role === "admin"
  const isGuildFounder = currentGuild?.guildFounderId === session.user.id

  return <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:px-6 lg:py-14"><div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" /><div className="relative z-10 mx-auto w-full max-w-6xl space-y-6">
    <Button asChild variant="ghost" className="-ml-3"><Link href="/torneios"><ArrowLeft aria-hidden="true" /> Voltar aos torneios</Link></Button>
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="space-y-6"><Card className="border-border/70 bg-card/90"><CardHeader><div className="flex flex-wrap items-center gap-2"><Badge variant={currentTournament.status === "open" ? "default" : currentTournament.status === "active" ? "default" : "outline"}>{currentTournament.status === "open" ? "Inscrições abertas" : currentTournament.status === "active" ? "Em andamento" : currentTournament.status === "finished" ? "Finalizado" : currentTournament.status}</Badge><Badge variant="secondary">{currentTournament.format === "guild" ? "Guildas" : "Individual"}</Badge></div><CardTitle className="mt-2 text-3xl">{currentTournament.name}</CardTitle><CardDescription className="max-w-2xl leading-7">{currentTournament.description || "Torneio oficial da comunidade Cinnabares."}</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><div className="flex items-center gap-3"><Users className="size-5 text-accent" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Vagas</p><p className="font-medium">{currentTournament.slots} {currentTournament.format === "guild" ? "guildas" : "players"}</p></div></div><div className="flex items-center gap-3"><Eye className="size-5 text-accent" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Inscrição</p><p className="font-medium">{visibilityLabels[currentTournament.visibility]}</p></div></div><div className="flex items-center gap-3"><Shield className="size-5 text-accent" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Composição</p><p className="font-medium">{currentTournament.teamSize} player{currentTournament.teamSize > 1 ? "s" : ""}</p></div></div></CardContent></Card><Card className="border-border/70 bg-card/90"><CardHeader><CardTitle>Tiers</CardTitle><CardDescription>Regras de composição desta chave.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2">{currentTournament.tiers.map((tier) => <Badge key={tier} variant="outline">{tierLabels[tier]}{currentTournament.format === "guild" ? `: ${currentTournament.tierRules[tier] ?? 0}` : ""}</Badge>)}</CardContent></Card></section>
     <aside><Card className="border-accent/30 bg-card/90"><CardHeader><CardTitle>{registration ? "Sua inscrição" : "Inscreva-se"}</CardTitle><CardDescription>{registration ? `Status: ${registration.status === "pending" ? "aguardando aprovação" : registration.status === "approved" ? "aprovada" : "recusada"}.` : currentTournament.format === "guild" ? "O líder escala os 5 players da guilda." : "Sua inscrição será enviada para aprovação de um admin."}</CardDescription></CardHeader><CardContent>{registration ? <div className="rounded-lg border border-border bg-background/50 p-4 text-sm text-muted-foreground">{registration.status === "rejected" ? registration.rejectionReason ?? "Inscrição recusada." : "Acompanhe o status da sua inscrição nesta página."}</div> : <RegistrationForm tournamentId={id} format={currentTournament.format} visibility={currentTournament.visibility} tiers={currentTournament.tiers} tierRules={currentTournament.tierRules} teamSize={currentTournament.teamSize} playerId={session.user.id} guildId={currentGuild?.guildId ?? null} isGuildFounder={isGuildFounder} status={currentTournament.status} />}</CardContent></Card></aside>
     </div>
     {(registration?.status === "approved" || isAdmin) ? <ParticipantsList tournamentId={id} visibility={currentTournament.visibility} status={currentTournament.status} /> : null}
      {isAdmin ? <TournamentControls tournamentId={id} status={currentTournament.status} /> : null}
     {(registration?.status === "approved" || isAdmin) && existingBracket ? <Card className="border-accent/30 bg-card/90"><CardHeader><div className="flex items-center gap-2"><Swords className="size-5 text-accent" aria-hidden="true" /><CardTitle>Chave do torneio</CardTitle></div><CardDescription>A chave já foi gerada e está ativa.</CardDescription></CardHeader><CardContent><Button asChild size="sm"><Link href={`/torneios/${id}/bracket`}>Ver chave completa <ExternalLink className="ml-1 size-3.5" aria-hidden="true" /></Link></Button></CardContent></Card> : null}
  </div></main>
}
