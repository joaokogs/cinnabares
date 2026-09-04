import { randomUUID } from "node:crypto"

import { getNextMatchSlot } from "@/lib/tournaments/bracket"
import { getBracketByTournamentId, getBracketMatch, getTournament } from "@/lib/tournaments/queries"
import {
  getMatchAtPosition,
  getPhaseCount,
  insertActionLog,
  revertCompletedMatch,
  updateCompletedMatch,
  updateMatchSlot,
  updateTournamentStatus,
} from "@/lib/tournaments/repository"
import type { BracketActionLogEntry } from "@/lib/tournaments/repository"

type MatchError = { ok: false; status: number; error: string }

function errorResult(status: number, error: string): MatchError {
  return { ok: false, status, error }
}

type MatchContextOptions = {
  expectedStatus: "pending" | "completed"
  wrongStatusMessage: string
  requireSlots: boolean
}

async function getMatchContext(tournamentId: string, matchId: string, options: MatchContextOptions) {
  const currentTournament = await getTournament(tournamentId)
  if (!currentTournament) return { error: errorResult(404, "Não encontramos esse torneio.") }
  if (currentTournament.status !== "active") return { error: errorResult(409, "Este torneio não está ativo.") }

  const currentBracket = await getBracketByTournamentId(tournamentId)
  if (!currentBracket) return { error: errorResult(404, "A chave deste torneio não foi iniciada.") }

  const match = await getBracketMatch(matchId)
  if (!match || match.bracketId !== currentBracket.id) return { error: errorResult(404, "Partida não encontrada nesta chave.") }
  if (match.status !== options.expectedStatus) return { error: errorResult(409, options.wrongStatusMessage) }
  if (options.requireSlots && (!match.slot1RegistrationId || !match.slot2RegistrationId)) {
    return { error: errorResult(409, "A partida ainda está aguardando um participante.") }
  }

  return { bracket: currentBracket, match }
}

type MatchInputBody = { winnerRegistrationId?: string; score1?: number; score2?: number }

function parseMatchInput(body: unknown): { ok: true; winnerRegistrationId: string } | { ok: false; error: string } {
  const input = body as MatchInputBody
  if (!input.winnerRegistrationId) return { ok: false, error: "Selecione o vencedor da partida." }
  return { ok: true, winnerRegistrationId: input.winnerRegistrationId }
}

function resolveRawScores(input: MatchInputBody, winnerIsSlot1: boolean): { score1: number; score2: number } | { error: string } {
  if (typeof input.score1 === "number" && typeof input.score2 === "number") {
    return { score1: input.score1, score2: input.score2 }
  }
  if (input.score1 === undefined && input.score2 === undefined) {
    return winnerIsSlot1 ? { score1: 3, score2: 0 } : { score1: 0, score2: 3 }
  }
  return { error: "Informe o placar completo da série." }
}

function invalidScoreValue(score: number) {
  return !Number.isInteger(score) || score < 0 || score > 3
}

function computeMatchScores(input: MatchInputBody, winnerIsSlot1: boolean): { ok: true; score1: number; score2: number } | { ok: false; error: string } {
  const raw = resolveRawScores(input, winnerIsSlot1)
  if ("error" in raw) return { ok: false, error: raw.error }

  if (invalidScoreValue(raw.score1) || invalidScoreValue(raw.score2)) {
    return { ok: false, error: "Placar inválido: cada placar deve estar entre 0 e 3." }
  }

  const winnerScore = winnerIsSlot1 ? raw.score1 : raw.score2
  const loserScore = winnerIsSlot1 ? raw.score2 : raw.score1
  if (winnerScore !== 3 || loserScore > 2) {
    return { ok: false, error: "A série é melhor de 5: o vencedor precisa de 3 vitórias e o perdedor pode ter no máximo 2." }
  }

  return { ok: true, score1: raw.score1, score2: raw.score2 }
}

export type ResolveMatchResult =
  | { ok: true; winnerRegistrationId: string; score1: number; score2: number; finished: boolean }
  | MatchError

async function finalizeMatch(
  tournamentId: string,
  logEntry: BracketActionLogEntry,
  result: { winnerRegistrationId: string; score1: number; score2: number },
): Promise<ResolveMatchResult> {
  await insertActionLog(logEntry)
  await updateTournamentStatus(tournamentId, "finished")
  return { ok: true, ...result, finished: true }
}

export async function resolveMatch(tournamentId: string, matchId: string, adminUserId: string, body: unknown): Promise<ResolveMatchResult> {
  const context = await getMatchContext(tournamentId, matchId, {
    expectedStatus: "pending",
    wrongStatusMessage: "Esta partida já foi finalizada.",
    requireSlots: true,
  })
  if (context.error) return context.error

  const input = parseMatchInput(body)
  if (!input.ok) return errorResult(400, input.error)
  if (input.winnerRegistrationId !== context.match.slot1RegistrationId && input.winnerRegistrationId !== context.match.slot2RegistrationId) {
    return errorResult(400, "O vencedor deve ser um dos participantes da partida.")
  }

  const scores = computeMatchScores(input, input.winnerRegistrationId === context.match.slot1RegistrationId)
  if (!scores.ok) return errorResult(400, scores.error)

  const updated = await updateCompletedMatch(matchId, {
    winnerRegistrationId: input.winnerRegistrationId,
    score1: scores.score1,
    score2: scores.score2,
  })
  if (!updated) return errorResult(409, "Não foi possível finalizar a partida. Tente novamente.")

  const totalPhases = await getPhaseCount(context.bracket.id)
  const logEntry: BracketActionLogEntry = {
    id: randomUUID(),
    bracketId: context.bracket.id,
    matchId,
    action: "resolve",
    winnerRegistrationId: input.winnerRegistrationId,
    createdBy: adminUserId,
  }

  if (context.match.phase === totalPhases - 1) {
    return finalizeMatch(tournamentId, logEntry, {
      winnerRegistrationId: input.winnerRegistrationId,
      score1: scores.score1,
      score2: scores.score2,
    })
  }

  const nextSlot = getNextMatchSlot(context.match.position)
  const nextMatch = await getMatchAtPosition(context.bracket.id, context.match.phase + 1, Math.floor(context.match.position / 2))

  await insertActionLog(logEntry)
  if (nextMatch) await updateMatchSlot(nextMatch.id, nextSlot, input.winnerRegistrationId)

  return { ok: true, winnerRegistrationId: input.winnerRegistrationId, score1: scores.score1, score2: scores.score2, finished: false }
}

export type RevertMatchResult = { ok: true } | MatchError

export async function revertMatch(tournamentId: string, matchId: string, adminUserId: string): Promise<RevertMatchResult> {
  const context = await getMatchContext(tournamentId, matchId, {
    expectedStatus: "completed",
    wrongStatusMessage: "Apenas partidas finalizadas podem ser desfeitas.",
    requireSlots: false,
  })
  if (context.error) return context.error

  const totalPhases = await getPhaseCount(context.bracket.id)
  const isFinal = context.match.phase === totalPhases - 1

  if (!isFinal) {
    const nextMatch = await getMatchAtPosition(context.bracket.id, context.match.phase + 1, Math.floor(context.match.position / 2))
    if (nextMatch?.status === "completed") {
      return errorResult(409, "Não é possível desfazer: a partida seguinte já foi finalizada. Desfaça-a primeiro.")
    }
  }

  await insertActionLog({
    id: randomUUID(),
    bracketId: context.bracket.id,
    matchId,
    action: "revert",
    winnerRegistrationId: context.match.winnerRegistrationId,
    createdBy: adminUserId,
  })

  await revertCompletedMatch(matchId)

  if (isFinal) {
    await updateTournamentStatus(tournamentId, "active")
    return { ok: true }
  }

  const nextSlot = getNextMatchSlot(context.match.position)
  const nextMatch = await getMatchAtPosition(context.bracket.id, context.match.phase + 1, Math.floor(context.match.position / 2))
  if (nextMatch) await updateMatchSlot(nextMatch.id, nextSlot, null)

  return { ok: true }
}