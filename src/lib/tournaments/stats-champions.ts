import { and, desc, eq, gte, lte, sql } from "drizzle-orm"
import { aliasedTable } from "drizzle-orm"

import { db } from "@/db"
import {
  bracket,
  bracketMatch,
  guild,
  tournament,
  tournamentRegistration,
  user,
} from "@/db/schema"
import type { TournamentRosterEntry } from "@/db/schema"

import type { ChampionTournament } from "./stats-core"
import type { StatsFilters } from "./stats-types"

export function finalMatchJoin(bracketAlias: typeof bracket) {
  const finalMatch = aliasedTable(bracketMatch, "final_match")
  const maxPhase = sql<number>`(select max(${bracketMatch.phase}) from ${bracketMatch} where ${bracketMatch.bracketId} = ${bracketAlias.id})`
  return {
    finalMatch,
    condition: and(
      eq(finalMatch.bracketId, bracketAlias.id),
      eq(finalMatch.phase, maxPhase),
      eq(finalMatch.position, 0),
      eq(finalMatch.status, "completed"),
    ),
  }
}

export async function getFinishedChampionTournaments(filters: StatsFilters = {}): Promise<ChampionTournament[]> {
  const { finalMatch, condition } = finalMatchJoin(bracket)
  const championReg = aliasedTable(tournamentRegistration, "champion_reg")
  const championUser = aliasedTable(user, "champion_user")
  const championGuild = aliasedTable(guild, "champion_guild")

  const where = [eq(tournament.status, "finished")]
  if (filters.format) where.push(eq(tournament.format, filters.format))
  if (filters.tier) where.push(sql`${tournament.tiers} ? ${filters.tier}`)
  if (filters.from) where.push(gte(tournament.createdAt, filters.from))
  if (filters.to) where.push(lte(tournament.createdAt, filters.to))

  const rows = await db
    .select({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      format: tournament.format,
      tiers: tournament.tiers,
      createdAt: tournament.createdAt,
      championRegistrationId: championReg.id,
      championUserId: championReg.userId,
      championGuildId: championReg.guildId,
      championRoster: championReg.roster,
      championUserName: championUser.name,
      championUserUsername: championUser.username,
      championGuildName: championGuild.name,
      championGuildTag: championGuild.tag,
    })
    .from(tournament)
    .innerJoin(bracket, eq(bracket.tournamentId, tournament.id))
    .innerJoin(finalMatch, condition)
    .innerJoin(championReg, eq(championReg.id, finalMatch.winnerRegistrationId))
    .leftJoin(championUser, eq(championUser.id, championReg.userId))
    .leftJoin(championGuild, eq(championGuild.id, championReg.guildId))
    .where(and(...where))
    .orderBy(desc(tournament.createdAt))

  return rows.map((row) => ({
    ...row,
    championRoster: (row.championRoster ?? []) as TournamentRosterEntry[],
  }))
}