import { and, eq, inArray, or, sql } from "drizzle-orm"
import { aliasedTable } from "drizzle-orm"

import { db } from "@/db"
import {
  bracket,
  bracketMatch,
  guildMember,
  tournament,
  tournamentRegistration,
  user,
} from "@/db/schema"
import type { TournamentRosterEntry } from "@/db/schema"

import type { BracketMatchLike, PlayerRosterSource } from "./stats-core"
import { computePlayerTopPokemon, computePlayerTopPokemonWithItems, derivePlacement } from "./stats-core"
import { finalMatchJoin } from "./stats-champions"
import { computePoints, type PointsSummary } from "./points"
import type {
  GuildStats,
  GuildTournamentResult,
  MemberFavorite,
  PlayerStats,
  PlayerTournamentResult,
  ResultInput,
} from "./stats-types"

export function buildResultWithPlacement({
  registrationStatus,
  tournamentStatus,
  registrationId,
  matches,
}: ResultInput): {
  result: "champion" | "eliminated" | "in_progress" | "pending" | "rejected" | "participated"
  isChampion: boolean
  placementRank: number | null
  placementLabel: string
} {
  if (registrationStatus === "pending") {
    return { result: "pending", isChampion: false, placementRank: null, placementLabel: "Em andamento" }
  }
  if (registrationStatus === "rejected") {
    return { result: "rejected", isChampion: false, placementRank: null, placementLabel: "Em andamento" }
  }

  const placement = derivePlacement(matches, registrationId)
  const isChampion = placement.rank === 1
  if (isChampion) {
    return { result: "champion", isChampion: true, placementRank: 1, placementLabel: "1º" }
  }
  if (placement.label !== "Em andamento") {
    return {
      result: "eliminated",
      isChampion: false,
      placementRank: placement.rank,
      placementLabel: placement.label,
    }
  }
  return {
    result: tournamentStatus === "finished" ? "participated" : "in_progress",
    isChampion: false,
    placementRank: null,
    placementLabel: "Em andamento",
  }
}

export async function getBracketMatchesForBrackets(bracketIds: string[]): Promise<Map<string, BracketMatchLike[]>> {
  const grouped = new Map<string, BracketMatchLike[]>()
  if (bracketIds.length === 0) return grouped

  const rows = await db
    .select({
      bracketId: bracketMatch.bracketId,
      phase: bracketMatch.phase,
      status: bracketMatch.status,
      slot1RegistrationId: bracketMatch.slot1RegistrationId,
      slot2RegistrationId: bracketMatch.slot2RegistrationId,
      winnerRegistrationId: bracketMatch.winnerRegistrationId,
    })
    .from(bracketMatch)
    .where(inArray(bracketMatch.bracketId, bracketIds))

  for (const row of rows) {
    const list = grouped.get(row.bracketId) ?? []
    list.push(row)
    grouped.set(row.bracketId, list)
  }

  return grouped
}

export async function getPlayerStats(userId: string): Promise<PlayerStats> {
  const { finalMatch, condition } = finalMatchJoin(bracket)

  const individualRows = await db
    .select({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      format: tournament.format,
      tiers: tournament.tiers,
      createdAt: tournament.createdAt,
      status: tournament.status,
      registrationStatus: tournamentRegistration.status,
      registrationId: tournamentRegistration.id,
      championRegistrationId: finalMatch.winnerRegistrationId,
      roster: tournamentRegistration.roster,
      guildId: tournamentRegistration.guildId,
      bracketId: bracket.id,
    })
    .from(tournamentRegistration)
    .innerJoin(tournament, eq(tournament.id, tournamentRegistration.tournamentId))
    .leftJoin(bracket, eq(bracket.tournamentId, tournament.id))
    .leftJoin(finalMatch, condition)
    .where(eq(tournamentRegistration.userId, userId))

  const guildRows = await db
    .select({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      format: tournament.format,
      tiers: tournament.tiers,
      createdAt: tournament.createdAt,
      status: tournament.status,
      registrationStatus: tournamentRegistration.status,
      registrationId: tournamentRegistration.id,
      championRegistrationId: finalMatch.winnerRegistrationId,
      roster: tournamentRegistration.roster,
      guildId: tournamentRegistration.guildId,
      bracketId: bracket.id,
    })
    .from(tournamentRegistration)
    .innerJoin(tournament, eq(tournament.id, tournamentRegistration.tournamentId))
    .innerJoin(guildMember, eq(guildMember.guildId, tournamentRegistration.guildId))
    .leftJoin(bracket, eq(bracket.tournamentId, tournament.id))
    .leftJoin(finalMatch, condition)
    .where(
      and(
        eq(guildMember.userId, userId),
        or(
          sql`${tournamentRegistration.roster} @> ${JSON.stringify([{ playerId: userId }])}::jsonb`,
          eq(tournament.visibility, "blind"),
        ),
      ),
    )

  const merged = new Map<string, (typeof individualRows)[number]>()
  for (const row of [...individualRows, ...guildRows]) {
    const existing = merged.get(row.registrationId)
    if (!existing || (row.championRegistrationId && !existing.championRegistrationId)) {
      merged.set(row.registrationId, row)
    }
  }

  const bracketIds = [...new Set([...merged.values()].map((row) => row.bracketId).filter((id): id is string => !!id))]
  const matchesByBracket = await getBracketMatchesForBrackets(bracketIds)

  const history: PlayerTournamentResult[] = [...merged.values()].map((row) => {
    const matches = row.bracketId ? (matchesByBracket.get(row.bracketId) ?? []) : []
    const built = buildResultWithPlacement({
      registrationStatus: row.registrationStatus,
      tournamentStatus: row.status,
      registrationId: row.registrationId,
      matches,
    })
    return {
      registrationId: row.registrationId,
      tournamentId: row.tournamentId,
      tournamentName: row.tournamentName,
      format: row.format,
      tiers: row.tiers,
      createdAt: row.createdAt,
      status: row.status,
      result: built.result,
      isChampion: built.isChampion,
      viaGuild: !!row.guildId,
      placementRank: built.placementRank,
      placementLabel: built.placementLabel,
    }
  })

  history.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateB - dateA
  })

  const sources: PlayerRosterSource[] = [...merged.values()]
    .filter((row) => row.registrationStatus === "approved")
    .map((row) => ({
      tournamentId: row.tournamentId,
      roster: (row.roster ?? []) as TournamentRosterEntry[],
    }))

  return { history, favorite: computePlayerTopPokemonWithItems(sources, userId, { limit: 6, itemsLimit: 3 }) }
}

export async function getGuildStats(guildId: string): Promise<GuildStats> {
  const { finalMatch, condition } = finalMatchJoin(bracket)

  const historyRows = await db
    .select({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      format: tournament.format,
      tiers: tournament.tiers,
      createdAt: tournament.createdAt,
      status: tournament.status,
      registrationStatus: tournamentRegistration.status,
      registrationId: tournamentRegistration.id,
      championRegistrationId: finalMatch.winnerRegistrationId,
      roster: tournamentRegistration.roster,
      bracketId: bracket.id,
    })
    .from(tournamentRegistration)
    .innerJoin(tournament, eq(tournament.id, tournamentRegistration.tournamentId))
    .leftJoin(bracket, eq(bracket.tournamentId, tournament.id))
    .leftJoin(finalMatch, condition)
    .where(and(eq(tournamentRegistration.guildId, guildId), eq(tournament.format, "guild")))

  const bracketIds = [...new Set(historyRows.map((row) => row.bracketId).filter((id): id is string => !!id))]
  const matchesByBracket = await getBracketMatchesForBrackets(bracketIds)

  const history: GuildTournamentResult[] = historyRows.map((row) => {
    const matches = row.bracketId ? (matchesByBracket.get(row.bracketId) ?? []) : []
    const built = buildResultWithPlacement({
      registrationStatus: row.registrationStatus,
      tournamentStatus: row.status,
      registrationId: row.registrationId,
      matches,
    })
    return {
      tournamentId: row.tournamentId,
      tournamentName: row.tournamentName,
      format: row.format,
      tiers: row.tiers,
      createdAt: row.createdAt,
      status: row.status,
      result: built.result,
      isChampion: built.isChampion,
      placementRank: built.placementRank,
      placementLabel: built.placementLabel,
    }
  })

  history.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateB - dateA
  })

  const members = await getGuildMembersLite(guildId)
  const registrationRosters = historyRows
    .filter((row) => row.registrationStatus === "approved")
    .map((row) => ({
      tournamentId: row.tournamentId,
      roster: (row.roster ?? []) as TournamentRosterEntry[],
    }))

  const rostersByPlayer = new Map<string, PlayerRosterSource[]>()
  for (const source of registrationRosters) {
    const seen = new Set<string>()
    for (const entry of source.roster ?? []) {
      const playerKey = (entry?.playerId ?? "").trim().toLowerCase()
      if (!playerKey || seen.has(playerKey)) continue
      seen.add(playerKey)
      const list = rostersByPlayer.get(playerKey) ?? []
      list.push(source)
      rostersByPlayer.set(playerKey, list)
    }
  }

  const memberFavorites: MemberFavorite[] = members.map((member) => ({
    userId: member.userId,
    name: member.name,
    username: member.username,
    top: computePlayerTopPokemon(rostersByPlayer.get(member.userId.trim().toLowerCase()) ?? [], member.userId, {
      limit: 3,
    }),
  }))

  return { history, members: memberFavorites }
}

async function getGuildMembersLite(guildId: string) {
  const gMember = aliasedTable(guildMember, "gm")
  return db
    .select({
      userId: user.id,
      name: user.name,
      username: user.username,
    })
    .from(gMember)
    .innerJoin(user, eq(user.id, gMember.userId))
    .where(eq(gMember.guildId, guildId))
}

export async function getPlayerPointsTotal(userId: string): Promise<PointsSummary> {
  const stats = await getPlayerStats(userId)
  return computePoints(stats.history.filter((item) => item.format === "individual"))
}

export async function getGuildPointsTotal(guildId: string): Promise<PointsSummary> {
  const stats = await getGuildStats(guildId)
  return computePoints(stats.history)
}