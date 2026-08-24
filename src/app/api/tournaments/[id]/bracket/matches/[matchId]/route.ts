import { randomUUID } from "node:crypto"
import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { bracketActionLog, bracketMatch, tournament } from "@/db/schema"
import { getAdminSession } from "@/lib/tournaments/auth"
import { getNextMatchSlot } from "@/lib/tournaments/bracket"
import { getBracketByTournamentId, getBracketMatch, getTournament } from "@/lib/tournaments/queries"

type RouteProps = { params: Promise<{ id: string; matchId: string }> }

export async function PATCH(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id, matchId } = await params
  const currentTournament = await getTournament(id)
  if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })
  if (currentTournament.status !== "active") return Response.json({ error: "Este torneio não está ativo." }, { status: 409 })

  const currentBracket = await getBracketByTournamentId(id)
  if (!currentBracket) return Response.json({ error: "A chave deste torneio não foi iniciada." }, { status: 404 })

  const match = await getBracketMatch(matchId)
  if (!match || match.bracketId !== currentBracket.id) return Response.json({ error: "Partida não encontrada nesta chave." }, { status: 404 })
  if (match.status !== "pending") return Response.json({ error: "Esta partida já foi finalizada." }, { status: 409 })
  if (!match.slot1RegistrationId || !match.slot2RegistrationId) return Response.json({ error: "A partida ainda está aguardando um participante." }, { status: 409 })

  const body = await request.json() as { winnerRegistrationId?: string }
  if (!body.winnerRegistrationId) return Response.json({ error: "Selecione o vencedor da partida." }, { status: 400 })

  if (body.winnerRegistrationId !== match.slot1RegistrationId && body.winnerRegistrationId !== match.slot2RegistrationId) {
    return Response.json({ error: "O vencedor deve ser um dos participantes da partida." }, { status: 400 })
  }

  const [updated] = await db
    .update(bracketMatch)
    .set({ winnerRegistrationId: body.winnerRegistrationId, status: "completed", updatedAt: new Date() })
    .where(and(eq(bracketMatch.id, matchId), eq(bracketMatch.status, "pending")))
    .returning({ id: bracketMatch.id })

  if (!updated) return Response.json({ error: "Não foi possível finalizar a partida. Tente novamente." }, { status: 409 })

  const totalPhases = await getPhaseCount(currentBracket.id)
  const isFinal = match.phase === totalPhases - 1

  const logEntry = {
    id: randomUUID(),
    bracketId: currentBracket.id,
    matchId,
    action: "resolve",
    winnerRegistrationId: body.winnerRegistrationId,
    createdBy: admin.session.user.id,
  }

  if (isFinal) {
    await db.insert(bracketActionLog).values(logEntry)
    await db.update(tournament).set({ status: "finished", updatedAt: new Date() }).where(eq(tournament.id, id))
    return Response.json({ winnerRegistrationId: body.winnerRegistrationId, finished: true })
  }

  const nextPhase = match.phase + 1
  const nextPosition = Math.floor(match.position / 2)
  const nextSlot = getNextMatchSlot(match.position)

  const [nextMatch] = await db
    .select()
    .from(bracketMatch)
    .where(and(eq(bracketMatch.bracketId, currentBracket.id), eq(bracketMatch.phase, nextPhase), eq(bracketMatch.position, nextPosition)))
    .limit(1)

  await db.insert(bracketActionLog).values(logEntry)
  if (nextMatch) {
    await db
      .update(bracketMatch)
      .set({ [nextSlot]: body.winnerRegistrationId, updatedAt: new Date() })
      .where(eq(bracketMatch.id, nextMatch.id))
  }

  return Response.json({ winnerRegistrationId: body.winnerRegistrationId, finished: false })
}

async function getPhaseCount(bracketId: string): Promise<number> {
  const [result] = await db
    .select({ maxPhase: sql<number>`coalesce(max(${bracketMatch.phase}) + 1, 0)` })
    .from(bracketMatch)
    .where(eq(bracketMatch.bracketId, bracketId))
  return result?.maxPhase ?? 0
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(_request.headers)
  if (admin.response) return admin.response

  const { id, matchId } = await params
  const currentTournament = await getTournament(id)
  if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })
  if (currentTournament.status !== "active") return Response.json({ error: "Este torneio não está ativo." }, { status: 409 })

  const currentBracket = await getBracketByTournamentId(id)
  if (!currentBracket) return Response.json({ error: "A chave deste torneio não foi iniciada." }, { status: 404 })

  const match = await getBracketMatch(matchId)
  if (!match || match.bracketId !== currentBracket.id) return Response.json({ error: "Partida não encontrada nesta chave." }, { status: 404 })
  if (match.status !== "completed") return Response.json({ error: "Apenas partidas finalizadas podem ser desfeitas." }, { status: 409 })

  const totalPhases = await getPhaseCount(currentBracket.id)
  const isFinal = match.phase === totalPhases - 1

  if (!isFinal) {
    const nextPhase = match.phase + 1
    const nextPosition = Math.floor(match.position / 2)
    const [nextMatch] = await db
      .select()
      .from(bracketMatch)
      .where(and(eq(bracketMatch.bracketId, currentBracket.id), eq(bracketMatch.phase, nextPhase), eq(bracketMatch.position, nextPosition)))
      .limit(1)

    if (nextMatch?.status === "completed") {
      return Response.json({ error: "Não é possível desfazer: a partida seguinte já foi finalizada. Desfaça-a primeiro." }, { status: 409 })
    }
  }

  const logEntry = {
    id: randomUUID(),
    bracketId: currentBracket.id,
    matchId,
    action: "revert",
    winnerRegistrationId: match.winnerRegistrationId,
    createdBy: admin.session.user.id,
  }

  await db.insert(bracketActionLog).values(logEntry)

  await db
    .update(bracketMatch)
    .set({ winnerRegistrationId: null, status: "pending", updatedAt: new Date() })
    .where(eq(bracketMatch.id, matchId))

  if (isFinal) {
    await db.update(tournament).set({ status: "active", updatedAt: new Date() }).where(eq(tournament.id, id))
  } else {
    const nextPhase = match.phase + 1
    const nextPosition = Math.floor(match.position / 2)
    const nextSlot = getNextMatchSlot(match.position)
    const [nextMatch] = await db
      .select()
      .from(bracketMatch)
      .where(and(eq(bracketMatch.bracketId, currentBracket.id), eq(bracketMatch.phase, nextPhase), eq(bracketMatch.position, nextPosition)))
      .limit(1)

    if (nextMatch) {
      await db
        .update(bracketMatch)
        .set({ [nextSlot]: null, updatedAt: new Date() })
        .where(eq(bracketMatch.id, nextMatch.id))
    }
  }

  return Response.json({ reverted: true, matchId })
}
