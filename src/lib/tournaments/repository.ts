import { and, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/db"
import { bracket, bracketActionLog, bracketMatch, guild, guildMember, tournament, tournamentRegistration } from "@/db/schema"
import type { MatchBattle, TournamentRosterEntry } from "@/db/schema"
import type { TournamentInput } from "@/lib/tournaments/input"

export type TournamentStatus = "draft" | "open" | "closed" | "active" | "finished"

export function createTournament(id: string, createdBy: string, data: TournamentInput) {
  return db.insert(tournament).values({ id, createdBy, ...data })
}

export async function updateTournamentStatus(id: string, status: TournamentStatus): Promise<{ id: string } | null> {
  const [updated] = await db.update(tournament).set({ status, updatedAt: new Date() }).where(eq(tournament.id, id)).returning({ id: tournament.id })
  return updated ?? null
}

export async function deleteTournament(id: string): Promise<{ id: string } | null> {
  const [deleted] = await db.delete(tournament).where(eq(tournament.id, id)).returning({ id: tournament.id })
  return deleted ?? null
}

export async function getGuildFounder(guildId: string) {
  const [result] = await db.select({ id: guild.id, founderId: guild.founderId }).from(guild).where(eq(guild.id, guildId)).limit(1)
  return result ?? null
}

export async function getGuildMemberUserIds(guildId: string, playerIds: string[]) {
  return db.select({ userId: guildMember.userId }).from(guildMember).where(and(eq(guildMember.guildId, guildId), inArray(guildMember.userId, playerIds)))
}

export async function countApprovedRegistrations(tournamentId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(tournamentRegistration)
    .where(and(eq(tournamentRegistration.tournamentId, tournamentId), eq(tournamentRegistration.status, "approved")))
  return result?.count ?? 0
}

export type NewTournamentRegistration = {
  id: string
  tournamentId: string
  userId: string | null
  guildId: string | null
  roster: TournamentRosterEntry[]
}

export async function insertTournamentRegistration(
  data: NewTournamentRegistration,
): Promise<{ ok: true } | { ok: false; status: 409 | 500; error: string }> {
  try {
    await db.insert(tournamentRegistration).values(data)
    return { ok: true }
  } catch (error) {
    const databaseError = error as { cause?: { code?: string } }
    if (databaseError.cause?.code === "23505") return { ok: false, status: 409, error: "Você ou sua guilda já enviou uma inscrição para este torneio." }
    return { ok: false, status: 500, error: "Não foi possível enviar a inscrição agora. Tente novamente em instantes." }
  }
}

export type RegistrationStatusUpdate = {
  status: "approved" | "rejected"
  rejectionReason: string | null
  reviewedBy: string
}

export async function updateRegistrationStatus(
  registrationId: string,
  tournamentId: string,
  data: RegistrationStatusUpdate,
): Promise<{ id: string; tournamentId: string } | null> {
  const [updated] = await db
    .update(tournamentRegistration)
    .set({
      status: data.status,
      rejectionReason: data.rejectionReason,
      reviewedBy: data.reviewedBy,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(tournamentRegistration.id, registrationId), eq(tournamentRegistration.tournamentId, tournamentId)))
    .returning({ id: tournamentRegistration.id, tournamentId: tournamentRegistration.tournamentId })
  return updated ?? null
}

export async function listApprovedRegistrationIds(tournamentId: string): Promise<string[]> {
  const rows = await db
    .select({ id: tournamentRegistration.id })
    .from(tournamentRegistration)
    .where(and(eq(tournamentRegistration.tournamentId, tournamentId), eq(tournamentRegistration.status, "approved")))
  return rows.map((row) => row.id)
}

export type BracketMatchRow = {
  id: string
  bracketId: string
  phase: number
  position: number
  slot1RegistrationId: string | null
  slot2RegistrationId: string | null
  status: "pending" | "completed"
  winnerRegistrationId: string | null
  score1: number
  score2: number
  battles: MatchBattle[]
}

export function insertBracketBatch(bracketId: string, tournamentId: string, matchRows: BracketMatchRow[]) {
  return db.batch([
    db.insert(bracket).values({ id: bracketId, tournamentId }),
    db.insert(bracketMatch).values(matchRows),
    db.update(tournament).set({ status: "active", updatedAt: new Date() }).where(and(eq(tournament.id, tournamentId), eq(tournament.status, "closed"))),
  ])
}

export async function updateCompletedMatch(
  matchId: string,
  data: { winnerRegistrationId: string; score1: number; score2: number; battles?: MatchBattle[] },
): Promise<{ id: string } | null> {
  const [updated] = await db
    .update(bracketMatch)
    .set({ winnerRegistrationId: data.winnerRegistrationId, status: "completed", score1: data.score1, score2: data.score2, ...(data.battles ? { battles: data.battles } : {}), updatedAt: new Date() })
    .where(and(eq(bracketMatch.id, matchId), eq(bracketMatch.status, "pending")))
    .returning({ id: bracketMatch.id })
  return updated ?? null
}

export async function getPhaseCount(bracketId: string): Promise<number> {
  const [result] = await db
    .select({ maxPhase: sql<number>`coalesce(max(${bracketMatch.phase}) + 1, 0)` })
    .from(bracketMatch)
    .where(eq(bracketMatch.bracketId, bracketId))
  return result?.maxPhase ?? 0
}

export async function getMatchAtPosition(bracketId: string, phase: number, position: number) {
  const [result] = await db
    .select()
    .from(bracketMatch)
    .where(and(eq(bracketMatch.bracketId, bracketId), eq(bracketMatch.phase, phase), eq(bracketMatch.position, position)))
    .limit(1)
  return result ?? null
}

export type BracketActionLogEntry = {
  id: string
  bracketId: string
  matchId: string
  action: "resolve" | "revert" | "order"
  winnerRegistrationId: string | null
  createdBy: string
}

export function insertActionLog(entry: BracketActionLogEntry) {
  return db.insert(bracketActionLog).values(entry)
}

export async function updateMatchSlot(matchId: string, slot: "slot1" | "slot2", registrationId: string | null, expectedStatus: "pending" | "completed" = "pending") {
  const update = slot === "slot1"
    ? { slot1RegistrationId: registrationId, battles: [], updatedAt: new Date() }
    : { slot2RegistrationId: registrationId, battles: [], updatedAt: new Date() }
  await db.update(bracketMatch).set(update).where(and(eq(bracketMatch.id, matchId), eq(bracketMatch.status, expectedStatus)))
}

export async function revertCompletedMatch(matchId: string) {
  await db
    .update(bracketMatch)
    .set({ winnerRegistrationId: null, status: "pending", score1: 0, score2: 0, battles: [], updatedAt: new Date() })
    .where(eq(bracketMatch.id, matchId))
}

export async function updateMatchBattles(matchId: string, battles: MatchBattle[]) {
  const [updated] = await db
    .update(bracketMatch)
    .set({ battles, updatedAt: new Date() })
    .where(and(eq(bracketMatch.id, matchId), eq(bracketMatch.status, "pending")))
    .returning({ id: bracketMatch.id })
  return updated ?? null
}

export async function updateMatchBattleState(matchId: string, data: { status: "pending" | "completed"; winnerRegistrationId: string | null; score1: number; score2: number; battles: MatchBattle[] }, expectedStatus: "pending" | "completed") {
  const [updated] = await db
    .update(bracketMatch)
    .set({ status: data.status, winnerRegistrationId: data.winnerRegistrationId, score1: data.score1, score2: data.score2, battles: data.battles, updatedAt: new Date() })
    .where(and(eq(bracketMatch.id, matchId), eq(bracketMatch.status, expectedStatus)))
    .returning({ id: bracketMatch.id })
  return updated ?? null
}
