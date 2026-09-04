import { randomUUID } from "node:crypto"

import { getNextMatchSlot } from "@/lib/tournaments/bracket"
import { getBracketByTournamentId, getBracketMatch, getTournament, getTournamentRegistrationsByIds } from "@/lib/tournaments/queries"
import type { MatchBattle, TournamentRosterEntry } from "@/db/schema"
import { validateBattleResults, validateBattles } from "@/lib/tournaments/battles"
import {
  getMatchAtPosition,
  getPhaseCount,
  insertActionLog,
  revertCompletedMatch,
  updateCompletedMatch,
  updateMatchBattleState,
  updateMatchBattles,
  updateMatchSlot,
  updateTournamentStatus,
} from "@/lib/tournaments/repository"
import type { BracketActionLogEntry } from "@/lib/tournaments/repository"

type MatchError = { ok: false; status: number; error: string }

function errorResult(status: number, error: string): MatchError {
  return { ok: false, status, error }
}

type MatchContextOptions = {
  expectedStatus: "pending" | "completed" | "pending-or-completed"
  wrongStatusMessage: string
  requireSlots: boolean
  allowFinished?: boolean
}

function canUseTournament(status: string, allowFinished = false) {
  return status === "active" || (allowFinished && status === "finished")
}

async function getMatchContext(tournamentId: string, matchId: string, options: MatchContextOptions) {
  const currentTournament = await getTournament(tournamentId)
  if (!currentTournament) return { error: errorResult(404, "Não encontramos esse torneio.") }
  if (!canUseTournament(currentTournament.status, options.allowFinished)) return { error: errorResult(409, "Este torneio não está ativo.") }

  const currentBracket = await getBracketByTournamentId(tournamentId)
  if (!currentBracket) return { error: errorResult(404, "A chave deste torneio não foi iniciada.") }

  const match = await getBracketMatch(matchId)
  if (!match || match.bracketId !== currentBracket.id) return { error: errorResult(404, "Partida não encontrada nesta chave.") }
  if (options.expectedStatus !== "pending-or-completed" && match.status !== options.expectedStatus) return { error: errorResult(409, options.wrongStatusMessage) }
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

type ResolveValidation = { ok: true; input: { ok: true; winnerRegistrationId: string }; scores: { ok: true; score1: number; score2: number } } | MatchError

async function finalizeMatch(
  tournamentId: string,
  logEntry: BracketActionLogEntry,
  result: { winnerRegistrationId: string; score1: number; score2: number },
): Promise<ResolveMatchResult> {
  await insertActionLog(logEntry)
  await updateTournamentStatus(tournamentId, "finished")
  return { ok: true, ...result, finished: true }
}

async function completeMatch({ tournamentId, bracketId, match, matchId, adminUserId, result }: { tournamentId: string; bracketId: string; match: { phase: number; position: number }; matchId: string; adminUserId: string; result: { winnerRegistrationId: string; score1: number; score2: number; battles?: MatchBattle[] } }): Promise<ResolveMatchResult> {
  const updated = await updateCompletedMatch(matchId, result)
  if (!updated) return errorResult(409, "Não foi possível finalizar a partida. Tente novamente.")

  const logEntry: BracketActionLogEntry = {
    id: randomUUID(),
    bracketId,
    matchId,
    action: "resolve",
    winnerRegistrationId: result.winnerRegistrationId,
    createdBy: adminUserId,
  }
  const totalPhases = await getPhaseCount(bracketId)
  if (match.phase === totalPhases - 1) return finalizeMatch(tournamentId, logEntry, result)

  await insertActionLog(logEntry)
  await updateNextMatchWinner(bracketId, match, result.winnerRegistrationId)
  return { ok: true, winnerRegistrationId: result.winnerRegistrationId, score1: result.score1, score2: result.score2, finished: false }
}

async function updateNextMatchWinner(bracketId: string, match: { phase: number; position: number }, winnerRegistrationId: string) {
  const totalPhases = await getPhaseCount(bracketId)
  if (match.phase === totalPhases - 1) return
  const nextMatch = await getMatchAtPosition(bracketId, match.phase + 1, Math.floor(match.position / 2))
  if (nextMatch) await updateMatchSlot(nextMatch.id, getNextMatchSlot(match.position), winnerRegistrationId)
}

async function hasCompletedNextMatch(bracketId: string, match: { phase: number; position: number }) {
  const totalPhases = await getPhaseCount(bracketId)
  if (match.phase === totalPhases - 1) return false
  const nextMatch = await getMatchAtPosition(bracketId, match.phase + 1, Math.floor(match.position / 2))
  return nextMatch?.status === "completed"
}

function countBattleWins(battles: MatchBattle[], slot1PlayerIds: Set<string>) {
  const slot1Wins = battles.filter((battle) => battle.winnerPlayerId && slot1PlayerIds.has(battle.winnerPlayerId)).length
  return { slot1Wins, slot2Wins: battles.filter((battle) => Boolean(battle.winnerPlayerId)).length - slot1Wins }
}

async function savePendingBattleOrder({ matchId, bracketId, adminUserId, battles }: { matchId: string; bracketId: string; adminUserId: string; battles: MatchBattle[] }): Promise<SaveBattleOrderResult> {
  const updated = await updateMatchBattles(matchId, battles)
  if (!updated) return errorResult(409, "A partida foi atualizada. Recarregue a página e tente novamente.")
  await insertActionLog({ id: randomUUID(), bracketId, matchId, action: "order", winnerRegistrationId: null, createdBy: adminUserId })
  return { ok: true }
}

async function saveCompletedBattleResult({ bracketId, match, matchId, adminUserId, battles, winnerRegistrationId, score1, score2 }: { bracketId: string; match: { phase: number; position: number }; matchId: string; adminUserId: string; battles: MatchBattle[]; winnerRegistrationId: string; score1: number; score2: number }): Promise<SaveBattleOrderResult> {
  const updated = await updateMatchBattleState(matchId, { status: "completed", winnerRegistrationId, score1, score2, battles }, "completed")
  if (!updated) return errorResult(409, "A partida foi atualizada. Recarregue a página e tente novamente.")
  await updateNextMatchWinner(bracketId, match, winnerRegistrationId)
  await insertActionLog({ id: randomUUID(), bracketId, matchId, action: "resolve", winnerRegistrationId, createdBy: adminUserId })
  return { ok: true, winnerRegistrationId, score1, score2, finished: true }
}

async function reopenCompletedBattleOrder({ tournamentId, bracketId, match, matchId, adminUserId, battles }: { tournamentId: string; bracketId: string; match: { phase: number; position: number }; matchId: string; adminUserId: string; battles: MatchBattle[] }): Promise<SaveBattleOrderResult> {
  const totalPhases = await getPhaseCount(bracketId)
  const isFinal = match.phase === totalPhases - 1
  const updated = await updateMatchBattleState(matchId, { status: "pending", winnerRegistrationId: null, score1: 0, score2: 0, battles }, "completed")
  if (!updated) return errorResult(409, "A partida foi atualizada. Recarregue a página e tente novamente.")
  if (isFinal) await updateTournamentStatus(tournamentId, "active")
  const nextMatch = await getMatchAtPosition(bracketId, match.phase + 1, Math.floor(match.position / 2))
  if (nextMatch) await updateMatchSlot(nextMatch.id, getNextMatchSlot(match.position), null)
  const saved = await savePendingBattleOrder({ matchId, bracketId, adminUserId, battles })
  return saved.ok ? { ...saved, reopened: true } : saved
}

export async function resolveMatch(tournamentId: string, matchId: string, adminUserId: string, body: unknown): Promise<ResolveMatchResult> {
  const context = await getMatchContext(tournamentId, matchId, {
    expectedStatus: "pending",
    wrongStatusMessage: "Esta partida já foi finalizada.",
    requireSlots: true,
  })
  if (context.error) return context.error

  const validation = await validateResolveInput(body, context.match)
  if (!validation.ok) return validation
  const { input, scores } = validation

  return completeMatch({ tournamentId, bracketId: context.bracket.id, match: context.match, matchId, adminUserId, result: {
    winnerRegistrationId: input.winnerRegistrationId,
    score1: scores.score1,
    score2: scores.score2,
  } })
}

function rosterEntries(raw: unknown): TournamentRosterEntry[] {
  return Array.isArray(raw) ? raw as TournamentRosterEntry[] : []
}

async function validateStoredBattleResults(match: { slot1RegistrationId: string | null; slot2RegistrationId: string | null; battles: MatchBattle[] }, score1: number, score2: number): Promise<string | null> {
  if (match.battles.length === 0) return null
  const slot1Id = match.slot1RegistrationId
  const slot2Id = match.slot2RegistrationId
  if (!slot1Id || !slot2Id) return "A partida ainda está aguardando um participante."

  const registrations = await getTournamentRegistrationsByIds([slot1Id, slot2Id])
  const slot1 = registrations.find((registration) => registration.id === slot1Id)
  const slot2 = registrations.find((registration) => registration.id === slot2Id)
  if (!slot1 || !slot2) return "Não foi possível carregar as escalações desta partida."

  return validateBattleResults({
    battles: match.battles,
    slot1Roster: rosterEntries(slot1.roster),
    slot2Roster: rosterEntries(slot2.roster),
    score1,
    score2,
  })
}

async function validateResolveInput(body: unknown, match: { slot1RegistrationId: string | null; slot2RegistrationId: string | null; battles: MatchBattle[] }): Promise<ResolveValidation> {
  const input = parseMatchInput(body)
  if (!input.ok) return errorResult(400, input.error)
  if (input.winnerRegistrationId !== match.slot1RegistrationId && input.winnerRegistrationId !== match.slot2RegistrationId) return errorResult(400, "O vencedor deve ser um dos participantes da partida.")

  const scores = computeMatchScores(input, input.winnerRegistrationId === match.slot1RegistrationId)
  if (!scores.ok) return errorResult(400, scores.error)
  const battleError = await validateStoredBattleResults(match, scores.score1, scores.score2)
  if (battleError) return errorResult(400, battleError)
  return { ok: true, input, scores }
}

type MatchRosterData = { slot1Id: string; slot2Id: string; slot1Roster: TournamentRosterEntry[]; slot2Roster: TournamentRosterEntry[] }

async function getMatchRosterData(match: { slot1RegistrationId: string | null; slot2RegistrationId: string | null }): Promise<MatchRosterData | MatchError> {
  const slot1Id = match.slot1RegistrationId
  const slot2Id = match.slot2RegistrationId
  if (!slot1Id || !slot2Id) return errorResult(409, "A partida ainda está aguardando um participante.")
  const registrations = await getTournamentRegistrationsByIds([slot1Id, slot2Id])
  const slot1 = registrations.find((registration) => registration.id === slot1Id)
  const slot2 = registrations.find((registration) => registration.id === slot2Id)
  if (!slot1 || !slot2) return errorResult(404, "Não foi possível carregar as escalações desta partida.")
  return { slot1Id, slot2Id, slot1Roster: rosterEntries(slot1.roster), slot2Roster: rosterEntries(slot2.roster) }
}

export type SaveBattleOrderResult = { ok: true; reopened?: boolean; winnerRegistrationId?: string; score1?: number; score2?: number; finished?: boolean } | MatchError

type BattleOrderContext = { bracket: { id: string }; match: { status: "pending" | "completed"; phase: number; position: number } }

async function saveBattleOrderState({ tournamentId, matchId, adminUserId, battles, context, rosterData, slot1Wins, slot2Wins }: { tournamentId: string; matchId: string; adminUserId: string; battles: MatchBattle[]; context: BattleOrderContext; rosterData: MatchRosterData; slot1Wins: number; slot2Wins: number }): Promise<SaveBattleOrderResult> {
  if (slot1Wins > 3 || slot2Wins > 3) return errorResult(400, "Uma série melhor de 5 termina na terceira vitória.")
  if (context.match.status === "completed" && await hasCompletedNextMatch(context.bracket.id, context.match)) return errorResult(409, "Não é possível alterar: a partida seguinte já foi finalizada.")

  if (slot1Wins === 3 || slot2Wins === 3) {
    const winnerRegistrationId = slot1Wins === 3 ? rosterData.slot1Id : rosterData.slot2Id
    const resultError = validateBattleResults({ battles, slot1Roster: rosterData.slot1Roster, slot2Roster: rosterData.slot2Roster, score1: slot1Wins, score2: slot2Wins })
    if (resultError) return errorResult(400, resultError)
    if (context.match.status === "pending") return completeMatch({ tournamentId, bracketId: context.bracket.id, match: context.match, matchId, adminUserId, result: { winnerRegistrationId, score1: slot1Wins, score2: slot2Wins, battles } })
    return saveCompletedBattleResult({ bracketId: context.bracket.id, match: context.match, matchId, adminUserId, battles, winnerRegistrationId, score1: slot1Wins, score2: slot2Wins })
  }

  if (context.match.status === "completed") return reopenCompletedBattleOrder({ tournamentId, bracketId: context.bracket.id, match: context.match, matchId, adminUserId, battles })
  return savePendingBattleOrder({ matchId, bracketId: context.bracket.id, adminUserId, battles })
}

export async function saveBattleOrder(tournamentId: string, matchId: string, adminUserId: string, battles: MatchBattle[]): Promise<SaveBattleOrderResult> {
  const context = await getMatchContext(tournamentId, matchId, {
    expectedStatus: "pending-or-completed",
    wrongStatusMessage: "Não foi possível atualizar as batalhas.",
    requireSlots: true,
    allowFinished: true,
  })
  if (context.error) return context.error
  if (!Array.isArray(battles)) return errorResult(400, "Informe uma ordem de batalhas válida.")

  const rosterData = await getMatchRosterData(context.match)
  if ("error" in rosterData) return rosterData

  const error = validateBattles(battles, rosterData.slot1Roster, rosterData.slot2Roster)
  if (error) return errorResult(400, error)

  const { slot1Wins, slot2Wins } = countBattleWins(battles, new Set(rosterData.slot1Roster.map((entry) => entry.playerId)))
  return saveBattleOrderState({ tournamentId, matchId, adminUserId, battles, context: context as BattleOrderContext, rosterData, slot1Wins, slot2Wins })
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
