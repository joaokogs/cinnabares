import type { ChampionStat, ChampionTournament, ItemStat, PokemonStat } from "./stats-shared"
import { championPokemon, normalizeKey } from "./stats-shared"

type WinAggregate = { name: string; tournamentIds: Set<string> }
type UseAggregate = { name: string; count: number }

function aggregateWinsAndUses(
  tournaments: ChampionTournament[] | null | undefined,
  selectName: (mon: { name: string; item: string | null }) => string | null,
): { winsByKey: Map<string, WinAggregate>; usesByKey: Map<string, UseAggregate> } {
  const winsByKey = new Map<string, WinAggregate>()
  const usesByKey = new Map<string, UseAggregate>()

  for (const tournament of tournaments ?? []) {
    const tournamentId = tournament?.tournamentId
    if (!tournamentId) continue

    const seen = new Set<string>()
    for (const mon of championPokemon(tournament)) {
      const rawName = selectName(mon)
      const key = normalizeKey(rawName)
      if (!key) continue

      const use = usesByKey.get(key) ?? { name: rawName as string, count: 0 }
      use.count += 1
      usesByKey.set(key, use)

      if (!seen.has(key)) {
        seen.add(key)
        const win = winsByKey.get(key) ?? { name: rawName as string, tournamentIds: new Set<string>() }
        win.tournamentIds.add(tournamentId)
        winsByKey.set(key, win)
      }
    }
  }

  return { winsByKey, usesByKey }
}

function buildWinUseStats(
  winsByKey: Map<string, WinAggregate>,
  usesByKey: Map<string, UseAggregate>,
  limit?: number,
): PokemonStat[] {
  const list: PokemonStat[] = []
  for (const [key, win] of winsByKey) {
    list.push({ name: win.name, wins: win.tournamentIds.size, uses: usesByKey.get(key)?.count ?? 0 })
  }
  list.sort((a, b) => b.wins - a.wins || b.uses - a.uses || a.name.localeCompare(b.name))
  return limit ? list.slice(0, limit) : list
}

export function computeTopWinningPokemon(
  tournaments: ChampionTournament[] | null | undefined,
  opts: { limit?: number } = {},
): PokemonStat[] {
  const { winsByKey, usesByKey } = aggregateWinsAndUses(tournaments, (mon) => mon.name)
  return buildWinUseStats(winsByKey, usesByKey, opts.limit)
}

export function computeTopWinningItems(
  tournaments: ChampionTournament[] | null | undefined,
  opts: { limit?: number } = {},
): ItemStat[] {
  const { winsByKey, usesByKey } = aggregateWinsAndUses(tournaments, (mon) => mon.item)
  return buildWinUseStats(winsByKey, usesByKey, opts.limit)
}

type ChampionAggregate = ChampionStat & { tournamentIds: Set<string> }

function championIdentity(tournament: ChampionTournament): { isGuild: boolean; id: string | null; name: string; tag: string | null } {
  const isGuild = tournament.format === "guild"
  const id = isGuild ? tournament.championGuildId : tournament.championUserId
  const name = isGuild
    ? (tournament.championGuildName ?? "Guilda")
    : (tournament.championUserName ?? tournament.championUserUsername ?? "Player")
  const tag = isGuild ? (tournament.championGuildTag ?? null) : null
  return { isGuild, id, name, tag }
}

function aggregateChampions(tournaments: ChampionTournament[] | null | undefined): Map<string, ChampionAggregate> {
  const byKey = new Map<string, ChampionAggregate>()

  for (const tournament of tournaments ?? []) {
    const tournamentId = tournament?.tournamentId
    if (!tournamentId) continue

    const { isGuild, id, name, tag } = championIdentity(tournament)
    const key = `${isGuild ? "g" : "p"}:${id ?? name}`

    const entry = byKey.get(key) ?? {
      type: isGuild ? "guild" : "player",
      id: id ?? null,
      name,
      tag,
      wins: 0,
      tournamentIds: new Set<string>(),
    }
    if (!entry.tournamentIds.has(tournamentId)) {
      entry.tournamentIds.add(tournamentId)
      entry.wins += 1
    }
    byKey.set(key, entry)
  }

  return byKey
}

function buildChampionStats(byKey: Map<string, ChampionAggregate>): ChampionStat[] {
  const list: ChampionStat[] = []
  for (const entry of byKey.values()) {
    const { tournamentIds, ...rest } = entry
    void tournamentIds
    list.push(rest)
  }
  list.sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
  return list
}

export function computeTopChampions(
  tournaments: ChampionTournament[] | null | undefined,
  opts: { limit?: number } = {},
): ChampionStat[] {
  const list = buildChampionStats(aggregateChampions(tournaments))
  return opts.limit ? list.slice(0, opts.limit) : list
}