import { and, asc, desc, eq, sql } from "drizzle-orm"
import { aliasedTable } from "drizzle-orm"

import { db } from "@/db"
import { bracket, bracketMatch, guild, guildMember, tournament, tournamentRegistration, user } from "@/db/schema"

export async function listTournaments(includeDrafts = false) {
  const query = db
    .select({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      format: tournament.format,
      tiers: tournament.tiers,
      tierRules: tournament.tierRules,
      slots: tournament.slots,
      visibility: tournament.visibility,
      status: tournament.status,
      teamSize: tournament.teamSize,
      createdAt: tournament.createdAt,
      approvedCount: sql<number>`cast(count(case when ${tournamentRegistration.status} = 'approved' then 1 end) as int)`,
      pendingCount: sql<number>`cast(count(case when ${tournamentRegistration.status} = 'pending' then 1 end) as int)`,
    })
    .from(tournament)
    .leftJoin(tournamentRegistration, eq(tournamentRegistration.tournamentId, tournament.id))
    .groupBy(tournament.id)
    .orderBy(desc(tournament.createdAt))

  return includeDrafts ? query : query.where(sql`${tournament.status} <> 'draft'`)
}

export async function getTournament(id: string) {
  const [result] = await db.select().from(tournament).where(eq(tournament.id, id)).limit(1)
  return result ?? null
}

export async function getTournamentRegistration(tournamentId: string, userId: string) {
  const [result] = await db
    .select()
    .from(tournamentRegistration)
    .where(and(eq(tournamentRegistration.tournamentId, tournamentId), eq(tournamentRegistration.userId, userId)))
    .limit(1)
  return result ?? null
}

export async function getUserTournamentRegistration(tournamentId: string, userId: string) {
  const [result] = await db
    .select({ registration: tournamentRegistration })
    .from(tournamentRegistration)
    .leftJoin(guildMember, eq(guildMember.guildId, tournamentRegistration.guildId))
    .where(and(
      eq(tournamentRegistration.tournamentId, tournamentId),
      sql`${tournamentRegistration.userId} = ${userId} or ${guildMember.userId} = ${userId}`,
    ))
    .limit(1)
  return result?.registration ?? null
}

export async function listTournamentRegistrations(tournamentId: string) {
  return db
    .select({
      id: tournamentRegistration.id,
      status: tournamentRegistration.status,
      roster: tournamentRegistration.roster,
      rejectionReason: tournamentRegistration.rejectionReason,
      createdAt: tournamentRegistration.createdAt,
      reviewedAt: tournamentRegistration.reviewedAt,
      userId: user.id,
      username: user.username,
      userName: user.name,
      guildId: guild.id,
      guildName: guild.name,
      guildTag: guild.tag,
    })
    .from(tournamentRegistration)
    .leftJoin(user, eq(tournamentRegistration.userId, user.id))
    .leftJoin(guild, eq(tournamentRegistration.guildId, guild.id))
    .where(eq(tournamentRegistration.tournamentId, tournamentId))
    .orderBy(asc(tournamentRegistration.status), asc(tournamentRegistration.createdAt))
}

export async function getBracketByTournamentId(tournamentId: string) {
  const [result] = await db.select().from(bracket).where(eq(bracket.tournamentId, tournamentId)).limit(1)
  return result ?? null
}

export async function getBracketMatch(matchId: string) {
  const [result] = await db.select().from(bracketMatch).where(eq(bracketMatch.id, matchId)).limit(1)
  return result ?? null
}

export async function getBracketMatchesWithRegistrations(bracketId: string) {
  const slot2Reg = aliasedTable(tournamentRegistration, "slot2_reg")
  const slot2User = aliasedTable(user, "slot2_user")
  const slot2Guild = aliasedTable(guild, "slot2_guild")
  const winnerReg = aliasedTable(tournamentRegistration, "winner_reg")
  const winnerUser = aliasedTable(user, "winner_user")
  const winnerGuild = aliasedTable(guild, "winner_guild")

  return db
    .select({
      id: bracketMatch.id,
      phase: bracketMatch.phase,
      position: bracketMatch.position,
      slot1RegistrationId: bracketMatch.slot1RegistrationId,
      slot2RegistrationId: bracketMatch.slot2RegistrationId,
      winnerRegistrationId: bracketMatch.winnerRegistrationId,
      status: bracketMatch.status,
      slot1Name: sql<string>`coalesce(${guild.name}, ${user.username}, ${user.name}, 'bye')`,
      slot1GuildTag: guild.tag,
      slot1Roster: tournamentRegistration.roster,
      slot2Name: sql<string>`coalesce(${slot2Guild.name}, ${slot2User.username}, ${slot2User.name}, 'bye')`,
      slot2GuildTag: slot2Guild.tag,
      slot2Roster: slot2Reg.roster,
      winnerName: sql<string>`coalesce(${winnerGuild.name}, ${winnerUser.username}, ${winnerUser.name})`,
    })
    .from(bracketMatch)
    .leftJoin(tournamentRegistration, eq(bracketMatch.slot1RegistrationId, tournamentRegistration.id))
    .leftJoin(user, eq(tournamentRegistration.userId, user.id))
    .leftJoin(guild, eq(tournamentRegistration.guildId, guild.id))
    .leftJoin(slot2Reg, eq(bracketMatch.slot2RegistrationId, slot2Reg.id))
    .leftJoin(slot2User, eq(slot2Reg.userId, slot2User.id))
    .leftJoin(slot2Guild, eq(slot2Reg.guildId, slot2Guild.id))
    .leftJoin(winnerReg, eq(bracketMatch.winnerRegistrationId, winnerReg.id))
    .leftJoin(winnerUser, eq(winnerReg.userId, winnerUser.id))
    .leftJoin(winnerGuild, eq(winnerReg.guildId, winnerGuild.id))
    .where(eq(bracketMatch.bracketId, bracketId))
    .orderBy(asc(bracketMatch.phase), asc(bracketMatch.position))
}
