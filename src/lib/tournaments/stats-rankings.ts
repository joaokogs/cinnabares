import { and, eq, gte, lte, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  bracket,
  guild,
  tournament,
  tournamentRegistration,
  user,
} from "@/db/schema"

import { derivePlacement } from "./stats-core"
import { getBracketMatchesForBrackets } from "./stats-history"
import { pointsForRank, sortPointsRanking } from "./points"
import type { GuildPointsRankingEntry, PlayerPointsRankingEntry, StatsFilters } from "./stats-types"

export async function getPlayerPointsRanking(filters: StatsFilters = {}): Promise<PlayerPointsRankingEntry[]> {
  const where = [
    eq(tournament.status, "finished"),
    eq(tournament.format, "individual"),
    eq(tournamentRegistration.status, "approved"),
  ]
  if (filters.tier) where.push(sql`${tournament.tiers} ? ${filters.tier}`)
  if (filters.from) where.push(gte(tournament.createdAt, filters.from))
  if (filters.to) where.push(lte(tournament.createdAt, filters.to))

  const rows = await db
    .select({
      registrationId: tournamentRegistration.id,
      bracketId: bracket.id,
      playerId: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
    })
    .from(tournamentRegistration)
    .innerJoin(tournament, eq(tournament.id, tournamentRegistration.tournamentId))
    .innerJoin(user, eq(user.id, tournamentRegistration.userId))
    .leftJoin(bracket, eq(bracket.tournamentId, tournament.id))
    .where(and(...where))

  const bracketIds = [...new Set(rows.map((row) => row.bracketId).filter((id): id is string => !!id))]
  const matchesByBracket = await getBracketMatchesForBrackets(bracketIds)

  const byPlayer = new Map<string, PlayerPointsRankingEntry>()
  for (const row of rows) {
    const matches = row.bracketId ? (matchesByBracket.get(row.bracketId) ?? []) : []
    const placement = derivePlacement(matches, row.registrationId)
    const points = pointsForRank(placement.rank)
    if (points <= 0) continue
    const entry = byPlayer.get(row.playerId) ?? {
      playerId: row.playerId,
      name: row.name,
      username: row.username,
      image: row.image,
      total: 0,
      tournaments: 0,
    }
    entry.total += points
    entry.tournaments += 1
    byPlayer.set(row.playerId, entry)
  }

  return sortPointsRanking([...byPlayer.values()])
}

export async function getGuildPointsRanking(filters: StatsFilters = {}): Promise<GuildPointsRankingEntry[]> {
  const where = [
    eq(tournament.status, "finished"),
    eq(tournament.format, "guild"),
    eq(tournamentRegistration.status, "approved"),
  ]
  if (filters.tier) where.push(sql`${tournament.tiers} ? ${filters.tier}`)
  if (filters.from) where.push(gte(tournament.createdAt, filters.from))
  if (filters.to) where.push(lte(tournament.createdAt, filters.to))

  const rows = await db
    .select({
      registrationId: tournamentRegistration.id,
      bracketId: bracket.id,
      guildId: guild.id,
      name: guild.name,
      tag: guild.tag,
    })
    .from(tournamentRegistration)
    .innerJoin(tournament, eq(tournament.id, tournamentRegistration.tournamentId))
    .innerJoin(guild, eq(guild.id, tournamentRegistration.guildId))
    .leftJoin(bracket, eq(bracket.tournamentId, tournament.id))
    .where(and(...where))

  const bracketIds = [...new Set(rows.map((row) => row.bracketId).filter((id): id is string => !!id))]
  const matchesByBracket = await getBracketMatchesForBrackets(bracketIds)

  const byGuild = new Map<string, GuildPointsRankingEntry>()
  for (const row of rows) {
    const matches = row.bracketId ? (matchesByBracket.get(row.bracketId) ?? []) : []
    const placement = derivePlacement(matches, row.registrationId)
    const points = pointsForRank(placement.rank)
    if (points <= 0) continue
    const entry = byGuild.get(row.guildId) ?? { guildId: row.guildId, name: row.name, tag: row.tag, total: 0, tournaments: 0 }
    entry.total += points
    entry.tournaments += 1
    byGuild.set(row.guildId, entry)
  }

  return sortPointsRanking([...byGuild.values()])
}