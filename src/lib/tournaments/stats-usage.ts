import type { TournamentRosterEntry } from "@/db/schema"

import type { ChampionTournament, PlayerPokemonStat, PlayerRosterSource, PokemonItemUsage } from "./stats-shared"
import { normalizeKey, pokemonName } from "./stats-shared"

type UseAggregate = { name: string; count: number }
type TournamentAggregate = { name: string; ids: Set<string> }

type ItemUsageAggregate = {
  name: string
  count: number
  itemsByKey: Map<string, { name: string; count: number }>
}

type PlayerPokemonState = {
  usesByKey: Map<string, UseAggregate>
  tournamentsByKey: Map<string, TournamentAggregate>
  countedThisTournament: Set<string>
}

function accumulateItemUsage(agg: ItemUsageAggregate, mon: { name?: string | null; item?: string | null }): void {
  const rawItem = mon?.item
  const item = typeof rawItem === "string" ? rawItem.trim() : ""
  if (!item) return
  const itemKey = item.toLowerCase()
  const existing = agg.itemsByKey.get(itemKey) ?? { name: item, count: 0 }
  existing.count += 1
  agg.itemsByKey.set(itemKey, existing)
}

function sortItems(agg: ItemUsageAggregate): { name: string; count: number }[] {
  return [...agg.itemsByKey.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function aggregateChampionItemUsage(tournaments: ChampionTournament[] | null | undefined): Map<string, ItemUsageAggregate> {
  const byKey = new Map<string, ItemUsageAggregate>()

  for (const tournament of tournaments ?? []) {
    const roster = tournament?.championRoster
    if (!Array.isArray(roster)) continue

    for (const entry of roster) {
      const team = entry?.team
      if (!Array.isArray(team)) continue
      for (const mon of team) {
        const name = pokemonName(mon)
        if (!name) continue
        const key = normalizeKey(name)
        const agg = byKey.get(key) ?? { name, count: 0, itemsByKey: new Map<string, { name: string; count: number }>() }
        agg.count += 1
        accumulateItemUsage(agg, mon)
        byKey.set(key, agg)
      }
    }
  }

  return byKey
}

function buildItemUsageList(byKey: Map<string, ItemUsageAggregate>, limit?: number, itemsLimit?: number): PokemonItemUsage[] {
  const list: PokemonItemUsage[] = []
  for (const agg of byKey.values()) {
    const items = sortItems(agg)
    list.push({ name: agg.name, uses: agg.count, items: items.slice(0, itemsLimit) })
  }
  list.sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
  return limit ? list.slice(0, limit) : list
}

export function computeChampionPokemonItemUsage(
  tournaments: ChampionTournament[] | null | undefined,
  opts: { limit?: number; itemsLimit?: number } = {},
): PokemonItemUsage[] {
  const byKey = aggregateChampionItemUsage(tournaments)
  return buildItemUsageList(byKey, opts.limit, opts.itemsLimit || undefined)
}

function accumulatePlayerPokemon(state: PlayerPokemonState, mon: { name?: string | null }, tournamentId: string): void {
  const name = pokemonName(mon)
  if (!name) return
  const monKey = normalizeKey(name)

  const use = state.usesByKey.get(monKey) ?? { name, count: 0 }
  use.count += 1
  state.usesByKey.set(monKey, use)

  if (!state.countedThisTournament.has(monKey)) {
    state.countedThisTournament.add(monKey)
    const tourn = state.tournamentsByKey.get(monKey) ?? { name, ids: new Set<string>() }
    tourn.ids.add(tournamentId)
    state.tournamentsByKey.set(monKey, tourn)
  }
}

function aggregatePlayerRoster(
  state: PlayerPokemonState,
  roster: TournamentRosterEntry[],
  playerKey: string,
  tournamentId: string,
): void {
  for (const entry of roster) {
    if (normalizeKey(entry?.playerId) !== playerKey) continue
    const team = entry?.team
    if (!Array.isArray(team)) continue
    for (const mon of team) {
      accumulatePlayerPokemon(state, mon, tournamentId)
    }
  }
}

function aggregatePlayerPokemon(
  sources: PlayerRosterSource[] | null | undefined,
  playerKey: string,
): { usesByKey: Map<string, UseAggregate>; tournamentsByKey: Map<string, TournamentAggregate> } {
  const usesByKey = new Map<string, UseAggregate>()
  const tournamentsByKey = new Map<string, TournamentAggregate>()

  for (const source of sources ?? []) {
    const tournamentId = source?.tournamentId
    const roster = source?.roster
    if (!tournamentId || !Array.isArray(roster)) continue

    aggregatePlayerRoster({ usesByKey, tournamentsByKey, countedThisTournament: new Set<string>() }, roster, playerKey, tournamentId)
  }

  return { usesByKey, tournamentsByKey }
}

function buildPlayerPokemonStats(
  usesByKey: Map<string, UseAggregate>,
  tournamentsByKey: Map<string, TournamentAggregate>,
  limit?: number,
): PlayerPokemonStat[] {
  const list: PlayerPokemonStat[] = []
  for (const [monKey, use] of usesByKey) {
    list.push({ name: use.name, uses: use.count, tournaments: tournamentsByKey.get(monKey)?.ids.size ?? 0 })
  }
  list.sort((a, b) => b.uses - a.uses || b.tournaments - a.tournaments || a.name.localeCompare(b.name))
  return limit ? list.slice(0, limit) : list
}

export function computePlayerTopPokemon(
  sources: PlayerRosterSource[] | null | undefined,
  playerId: string,
  opts: { limit?: number } = {},
): PlayerPokemonStat[] {
  const key = normalizeKey(playerId)
  if (!key) return []
  const { usesByKey, tournamentsByKey } = aggregatePlayerPokemon(sources, key)
  return buildPlayerPokemonStats(usesByKey, tournamentsByKey, opts.limit)
}

function aggregatePlayerRosterItems(
  byKey: Map<string, ItemUsageAggregate>,
  roster: TournamentRosterEntry[],
  playerKey: string,
): void {
  for (const entry of roster) {
    if (normalizeKey(entry?.playerId) !== playerKey || !Array.isArray(entry.team)) continue

    for (const mon of entry.team) {
      const name = pokemonName(mon)
      if (!name) continue

      const monKey = normalizeKey(name)
      const aggregate = byKey.get(monKey) ?? { name, count: 0, itemsByKey: new Map<string, { name: string; count: number }>() }
      aggregate.count += 1
      accumulateItemUsage(aggregate, mon)
      byKey.set(monKey, aggregate)
    }
  }
}

function aggregatePlayerItemUsage(sources: PlayerRosterSource[] | null | undefined, playerKey: string): Map<string, ItemUsageAggregate> {
  const byKey = new Map<string, ItemUsageAggregate>()

  for (const source of sources ?? []) {
    if (!source?.tournamentId || !Array.isArray(source.roster)) continue
    aggregatePlayerRosterItems(byKey, source.roster, playerKey)
  }

  return byKey
}

export function computePlayerTopPokemonWithItems(
  sources: PlayerRosterSource[] | null | undefined,
  playerId: string,
  opts: { limit?: number; itemsLimit?: number } = {},
): PokemonItemUsage[] {
  const key = normalizeKey(playerId)
  if (!key) return []
  const byKey = aggregatePlayerItemUsage(sources, key)
  return buildItemUsageList(byKey, opts.limit, opts.itemsLimit ?? 3)
}