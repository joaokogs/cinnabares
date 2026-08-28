import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm"
import { aliasedTable } from "drizzle-orm"

import { db } from "@/db"
import { bracket, bracketMatch, guild, guildMember, tournament, tournamentRegistration, user } from "@/db/schema"
import type { TournamentRosterEntry, TournamentTier } from "@/db/schema"

import type {
  BracketMatchLike,
  ChampionTournament,
  ChampionStat,
  ItemStat,
  PokemonItemUsage,
  PlayerPokemonStat,
  PlayerRosterSource,
  PokemonStat,
} from "./stats-core"
import {
  computeChampionPokemonItemUsage,
  computePlayerTopPokemon,
  computePlayerTopPokemonWithItems,
  computeTopChampions,
  computeTopWinningItems,
  computeTopWinningPokemon,
  derivePlacement,
} from "./stats-core"

export type StatsFilters = {
  tier?: TournamentTier
  format?: "guild"
  from?: Date
  to?: Date
}

export type PlayerTournamentResult = {
  registrationId: string
  tournamentId: string
  tournamentName: string
  format: "individual" | "guild"
  tiers: TournamentTier[]
  createdAt: Date | null
  status: string
  result: "champion" | "eliminated" | "in_progress" | "pending" | "rejected" | "participated"
  isChampion: boolean
  viaGuild: boolean
  placementRank: number | null
  placementLabel: string
}

export type GuildTournamentResult = {
  tournamentId: string
  tournamentName: string
  format: "individual" | "guild"
  tiers: TournamentTier[]
  createdAt: Date | null
  status: string
  result: "champion" | "eliminated" | "in_progress" | "pending" | "rejected" | "participated"
  isChampion: boolean
  placementRank: number | null
  placementLabel: string
}

export type MemberFavorite = {
  userId: string
  name: string | null
  username: string | null
  top: PlayerPokemonStat[]
}

export type PlayerStats = {
  history: PlayerTournamentResult[]
  favorite: PokemonItemUsage[]
}

export type GuildStats = {
  history: GuildTournamentResult[]
  members: MemberFavorite[]
}

function finalMatchJoin(bracketAlias: typeof bracket) {
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

type ResultInput = {
  registrationStatus: string
  tournamentStatus: string
  registrationId: string
  matches: BracketMatchLike[]
}

function buildResultWithPlacement({
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

async function getBracketMatchesForBrackets(bracketIds: string[]): Promise<Map<string, BracketMatchLike[]>> {
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

export {
  computeChampionPokemonItemUsage,
  computePlayerTopPokemon,
  computeTopChampions,
  computeTopWinningItems,
  computeTopWinningPokemon,
  derivePlacement,
}
export type {
  BracketMatchLike,
  ChampionStat,
  ItemStat,
  PokemonItemUsage,
  PokemonStat,
  PlayerPokemonStat,
}
