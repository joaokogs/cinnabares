import type { TournamentTier } from "@/db/schema"

import type { BracketMatchLike, PlayerPokemonStat, PokemonItemUsage } from "./stats-core"

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

export type PlayerPointsRankingEntry = {
  playerId: string
  name: string
  username: string | null
  image: string | null
  total: number
  tournaments: number
}

export type GuildPointsRankingEntry = {
  guildId: string
  name: string
  tag: string | null
  total: number
  tournaments: number
}

export type ResultInput = {
  registrationStatus: string
  tournamentStatus: string
  registrationId: string
  matches: BracketMatchLike[]
}