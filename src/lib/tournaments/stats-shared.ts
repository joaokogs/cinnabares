import type { TournamentRosterEntry, TournamentTier } from "@/db/schema"

export type ChampionTournament = {
  tournamentId: string
  tournamentName: string
  format: "individual" | "guild"
  tiers: TournamentTier[]
  createdAt: Date | string | null
  championRegistrationId: string | null
  championUserId: string | null
  championGuildId: string | null
  championRoster: TournamentRosterEntry[]
  championUserName: string | null
  championUserUsername: string | null
  championGuildName: string | null
  championGuildTag: string | null
}

export type PokemonStat = {
  name: string
  wins: number
  uses: number
}

export type ItemStat = {
  name: string
  wins: number
  uses: number
}

export type ChampionStat = {
  type: "player" | "guild"
  id: string | null
  name: string
  tag: string | null
  wins: number
}

export type PlayerRosterSource = {
  tournamentId: string
  roster: TournamentRosterEntry[] | null | undefined
}

export type PlayerPokemonStat = {
  name: string
  uses: number
  tournaments: number
}

export type PokemonItemUsage = {
  name: string
  uses: number
  items: { name: string; count: number }[]
}

export function normalizeKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

export function pokemonName(mon: { name?: string | null } | null | undefined): string {
  return (mon?.name ?? "").trim()
}

export function championPokemon(tournament: ChampionTournament): { name: string; item: string | null }[] {
  const result: { name: string; item: string | null }[] = []
  const roster = tournament?.championRoster
  if (!Array.isArray(roster)) return result

  for (const entry of roster) {
    const team = entry?.team
    if (!Array.isArray(team)) continue
    for (const mon of team) {
      const name = pokemonName(mon)
      if (!name) continue
      const rawItem = mon?.item
      const item = typeof rawItem === "string" ? rawItem.trim() || null : null
      result.push({ name, item })
    }
  }

  return result
}

export function titleCase(value: string | null | undefined): string {
  return (value ?? "")
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}