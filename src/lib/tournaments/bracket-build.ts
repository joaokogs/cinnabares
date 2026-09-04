import { randomUUID } from "node:crypto"

import { generateBracketMatches } from "@/lib/tournaments/bracket"
import { getBracketByTournamentId, getTournament } from "@/lib/tournaments/queries"
import { insertBracketBatch, listApprovedRegistrationIds } from "@/lib/tournaments/repository"
import type { BracketMatchRow } from "@/lib/tournaments/repository"

export type StartBracketResult =
  | { ok: true; bracketId: string }
  | { ok: false; status: 400 | 404 | 409 | 500; error: string }

function buildMatchRows(bracketId: string, registrationIds: string[]): BracketMatchRow[] {
  return generateBracketMatches(registrationIds).map((match) => ({
    id: randomUUID(),
    bracketId,
    phase: match.phase,
    position: match.position,
    slot1RegistrationId: match.slot1RegistrationId,
    slot2RegistrationId: match.slot2RegistrationId,
    status: "pending",
    winnerRegistrationId: null,
    score1: 0,
    score2: 0,
  }))
}

function propagateByes(matchRows: BracketMatchRow[]) {
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
    match.score1 = winnerRegistrationId === match.slot1RegistrationId ? 3 : 0
    match.score2 = winnerRegistrationId === match.slot2RegistrationId ? 3 : 0
    const nextMatch = matchesByPosition.get(`1:${Math.floor(match.position / 2)}`)
    if (nextMatch) {
      if (match.position % 2 === 0) nextMatch.slot1RegistrationId = winnerRegistrationId
      else nextMatch.slot2RegistrationId = winnerRegistrationId
    }
  }
}

export async function startTournamentBracket(tournamentId: string): Promise<StartBracketResult> {
  const currentTournament = await getTournament(tournamentId)
  if (!currentTournament) return { ok: false, status: 404, error: "Não encontramos esse torneio." }
  if (currentTournament.status !== "closed") return { ok: false, status: 409, error: "As inscrições precisam estar fechadas para iniciar o torneio." }

  const existingBracket = await getBracketByTournamentId(tournamentId)
  if (existingBracket) return { ok: false, status: 409, error: "Este torneio já possui uma chave ativa." }

  const approved = await listApprovedRegistrationIds(tournamentId)
  if (approved.length < 2) return { ok: false, status: 400, error: "É necessário pelo menos 2 inscrições aprovadas para iniciar o torneio." }

  const bracketId = randomUUID()
  const matchRows = buildMatchRows(bracketId, approved)
  propagateByes(matchRows)

  try {
    await insertBracketBatch(bracketId, tournamentId, matchRows)
  } catch (error) {
    const databaseError = error as { cause?: { code?: string } }
    if (databaseError.cause?.code === "23505") return { ok: false, status: 409, error: "Este torneio já foi iniciado. Atualize a página." }
    return { ok: false, status: 500, error: "Não foi possível iniciar o torneio agora. Tente novamente." }
  }

  return { ok: true, bracketId }
}