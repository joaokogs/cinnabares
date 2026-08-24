import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { bracket, bracketMatch, tournament, tournamentRegistration } from "@/db/schema"
import { getAdminSession } from "@/lib/tournaments/auth"
import { generateBracketMatches } from "@/lib/tournaments/bracket"
import { getBracketByTournamentId, getBracketMatchesWithRegistrations, getTournament } from "@/lib/tournaments/queries"

type RouteProps = { params: Promise<{ id: string }> }
type BracketMatchRow = {
  id: string
  bracketId: string
  phase: number
  position: number
  slot1RegistrationId: string | null
  slot2RegistrationId: string | null
  status: "pending" | "completed"
  winnerRegistrationId: string | null
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params
  const currentTournament = await getTournament(id)
  if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })

  const currentBracket = await getBracketByTournamentId(id)
  if (!currentBracket) return Response.json({ error: "A chave ainda não foi iniciada." }, { status: 404 })

  const matches = await getBracketMatchesWithRegistrations(currentBracket.id)
  const totalPhases = matches.length > 0 ? Math.max(...matches.map((m) => m.phase)) + 1 : 0

  const champion = matches.find((m) => m.phase === totalPhases - 1 && m.status === "completed")

  return Response.json({
    tournament: { name: currentTournament.name, status: currentTournament.status },
    totalPhases,
    matches,
    champion: champion ? { registrationId: champion.winnerRegistrationId, name: champion.winnerName } : null,
  })
}

export async function POST(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id } = await params
  const currentTournament = await getTournament(id)
  if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })
  if (currentTournament.status !== "closed") return Response.json({ error: "As inscrições precisam estar fechadas para iniciar o torneio." }, { status: 409 })

  const existingBracket = await getBracketByTournamentId(id)
  if (existingBracket) return Response.json({ error: "Este torneio já possui uma chave ativa." }, { status: 409 })

  const approved = await db
    .select({ id: tournamentRegistration.id })
    .from(tournamentRegistration)
    .where(and(eq(tournamentRegistration.tournamentId, id), eq(tournamentRegistration.status, "approved")))

  if (approved.length < 2) return Response.json({ error: "É necessário pelo menos 2 inscrições aprovadas para iniciar o torneio." }, { status: 400 })

  const bracketId = randomUUID()
  const matches = generateBracketMatches(approved.map((r) => r.id))
  const matchRows: BracketMatchRow[] = matches.map((m) => ({
    id: randomUUID(),
    bracketId,
    phase: m.phase,
    position: m.position,
    slot1RegistrationId: m.slot1RegistrationId,
    slot2RegistrationId: m.slot2RegistrationId,
    status: "pending",
    winnerRegistrationId: null,
  }))

  const matchesByPosition = new Map(matchRows.map((match) => [`${match.phase}:${match.position}`, match]))
  for (const match of matchRows.filter((currentMatch) => currentMatch.phase === 0)) {
    const winnerRegistrationId = match.slot1RegistrationId && !match.slot2RegistrationId
      ? match.slot1RegistrationId
      : !match.slot1RegistrationId && match.slot2RegistrationId
        ? match.slot2RegistrationId
        : null

    if (!winnerRegistrationId) continue

    match.status = "completed"
    match.winnerRegistrationId = winnerRegistrationId
    const nextMatch = matchesByPosition.get(`1:${Math.floor(match.position / 2)}`)
    if (nextMatch) {
      if (match.position % 2 === 0) nextMatch.slot1RegistrationId = winnerRegistrationId
      else nextMatch.slot2RegistrationId = winnerRegistrationId
    }
  }

  try {
    await db.batch([
      db.insert(bracket).values({ id: bracketId, tournamentId: id }),
      db.insert(bracketMatch).values(matchRows),
      db.update(tournament).set({ status: "active", updatedAt: new Date() }).where(and(eq(tournament.id, id), eq(tournament.status, "closed"))),
    ])
  } catch (error) {
    const databaseError = error as { cause?: { code?: string } }
    if (databaseError.cause?.code === "23505") return Response.json({ error: "Este torneio já foi iniciado. Atualize a página." }, { status: 409 })
    return Response.json({ error: "Não foi possível iniciar o torneio agora. Tente novamente." }, { status: 500 })
  }

  return Response.json({ bracketId }, { status: 201 })
}
