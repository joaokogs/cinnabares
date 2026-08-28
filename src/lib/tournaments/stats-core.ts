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

function normalizeKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

function pokemonName(mon: { name?: string | null } | null | undefined): string {
  return (mon?.name ?? "").trim()
}

function championPokemon(tournament: ChampionTournament): { name: string; item: string | null }[] {
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

export function computeTopWinningPokemon(
  tournaments: ChampionTournament[] | null | undefined,
  opts: { limit?: number } = {},
): PokemonStat[] {
  const winsByKey = new Map<string, { name: string; tournamentIds: Set<string> }>()
  const usesByKey = new Map<string, { name: string; count: number }>()

  for (const tournament of tournaments ?? []) {
    const tournamentId = tournament?.tournamentId
    if (!tournamentId) continue

    const seen = new Set<string>()
    for (const mon of championPokemon(tournament)) {
      const key = normalizeKey(mon.name)
      if (!key) continue

      const use = usesByKey.get(key) ?? { name: mon.name, count: 0 }
      use.count += 1
      usesByKey.set(key, use)

      if (!seen.has(key)) {
        seen.add(key)
        const win = winsByKey.get(key) ?? { name: mon.name, tournamentIds: new Set<string>() }
        win.tournamentIds.add(tournamentId)
        winsByKey.set(key, win)
      }
    }
  }

  const list: PokemonStat[] = []
  for (const [key, win] of winsByKey) {
    list.push({ name: win.name, wins: win.tournamentIds.size, uses: usesByKey.get(key)?.count ?? 0 })
  }

  list.sort((a, b) => b.wins - a.wins || b.uses - a.uses || a.name.localeCompare(b.name))
  return opts.limit ? list.slice(0, opts.limit) : list
}

export function computeTopWinningItems(
  tournaments: ChampionTournament[] | null | undefined,
  opts: { limit?: number } = {},
): ItemStat[] {
  const winsByKey = new Map<string, { name: string; tournamentIds: Set<string> }>()
  const usesByKey = new Map<string, { name: string; count: number }>()

  for (const tournament of tournaments ?? []) {
    const tournamentId = tournament?.tournamentId
    if (!tournamentId) continue

    const seen = new Set<string>()
    for (const mon of championPokemon(tournament)) {
      const key = normalizeKey(mon.item)
      if (!key) continue

      const use = usesByKey.get(key) ?? { name: mon.item as string, count: 0 }
      use.count += 1
      usesByKey.set(key, use)

      if (!seen.has(key)) {
        seen.add(key)
        const win = winsByKey.get(key) ?? { name: mon.item as string, tournamentIds: new Set<string>() }
        win.tournamentIds.add(tournamentId)
        winsByKey.set(key, win)
      }
    }
  }

  const list: ItemStat[] = []
  for (const [key, win] of winsByKey) {
    list.push({ name: win.name, wins: win.tournamentIds.size, uses: usesByKey.get(key)?.count ?? 0 })
  }

  list.sort((a, b) => b.wins - a.wins || b.uses - a.uses || a.name.localeCompare(b.name))
  return opts.limit ? list.slice(0, opts.limit) : list
}

export function computeTopChampions(
  tournaments: ChampionTournament[] | null | undefined,
  opts: { limit?: number } = {},
): ChampionStat[] {
  const byKey = new Map<string, ChampionStat & { tournamentIds: Set<string> }>()

  for (const tournament of tournaments ?? []) {
    const tournamentId = tournament?.tournamentId
    if (!tournamentId) continue

    const isGuild = tournament.format === "guild"
    const id = isGuild ? tournament.championGuildId : tournament.championUserId
    const name = isGuild
      ? (tournament.championGuildName ?? "Guilda")
      : (tournament.championUserName ?? tournament.championUserUsername ?? "Player")
    const tag = isGuild ? (tournament.championGuildTag ?? null) : null
    const key = `${isGuild ? "g" : "p"}:${id ?? name}`

    const entry = byKey.get(key) ?? { type: isGuild ? "guild" : "player", id: id ?? null, name, tag, wins: 0, tournamentIds: new Set<string>() }
    if (!entry.tournamentIds.has(tournamentId)) {
      entry.tournamentIds.add(tournamentId)
      entry.wins += 1
    }
    byKey.set(key, entry)
  }

  const list: ChampionStat[] = []
  for (const entry of byKey.values()) {
    const { tournamentIds, ...rest } = entry
    void tournamentIds
    list.push(rest)
  }

  list.sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
  return opts.limit ? list.slice(0, opts.limit) : list
}

export type BracketMatchLike = {
  phase: number | null | undefined
  status: string | null | undefined
  slot1RegistrationId: string | null | undefined
  slot2RegistrationId: string | null | undefined
  winnerRegistrationId: string | null | undefined
}

export type Placement = {
  rank: number | null
  label: string
}

export function derivePlacement(
  matches: BracketMatchLike[] | null | undefined,
  registrationId: string | null | undefined,
): Placement {
  const id = normalizeKey(registrationId)
  if (!id || !Array.isArray(matches) || matches.length === 0) {
    return { rank: null, label: "Em andamento" }
  }

  let maxPhase = -Infinity
  for (const match of matches) {
    const phase = typeof match?.phase === "number" ? match.phase : NaN
    if (!Number.isNaN(phase) && phase > maxPhase) maxPhase = phase
  }
  if (Number.isNaN(maxPhase)) return { rank: null, label: "Em andamento" }

  const finalMatch = matches.find((match) => match?.phase === maxPhase && match?.status === "completed")
  if (finalMatch && normalizeKey(finalMatch.winnerRegistrationId) === id) {
    return { rank: 1, label: "1º" }
  }

  let isFinalLoser = false
  let eliminatedPhase: number | null = null
  let everPlayed = false

  for (const match of matches) {
    if (normalizeKey(match?.slot1RegistrationId) !== id && normalizeKey(match?.slot2RegistrationId) !== id) continue
    everPlayed = true
    if (match?.status !== "completed") continue
    if (normalizeKey(match.winnerRegistrationId) === id) continue

    const phase = typeof match.phase === "number" ? match.phase : NaN
    if (Number.isNaN(phase)) continue

    if (phase === maxPhase) {
      isFinalLoser = true
    } else if (eliminatedPhase === null || phase > eliminatedPhase) {
      eliminatedPhase = phase
    }
  }

  if (isFinalLoser) return { rank: 2, label: "2º" }

  if (eliminatedPhase !== null) {
    const k = maxPhase - eliminatedPhase
    const lower = 2 ** k + 1
    const upper = 2 ** (k + 1)
    return { rank: lower, label: `${lower}º-${upper}º` }
  }

  if (everPlayed) return { rank: null, label: "Em andamento" }

  return { rank: null, label: "Em andamento" }
}

export type PokemonItemUsage = {
  name: string
  uses: number
  items: { name: string; count: number }[]
}

export function computeChampionPokemonItemUsage(
  tournaments: ChampionTournament[] | null | undefined,
  opts: { limit?: number; itemsLimit?: number } = {},
): PokemonItemUsage[] {
  const byKey = new Map<string, { name: string; count: number; itemsByKey: Map<string, { name: string; count: number }> }>()

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

        const rawItem = mon?.item
        const item = typeof rawItem === "string" ? rawItem.trim() : ""
        if (item) {
          const itemKey = item.toLowerCase()
          const existing = agg.itemsByKey.get(itemKey) ?? { name: item, count: 0 }
          existing.count += 1
          agg.itemsByKey.set(itemKey, existing)
        }
        byKey.set(key, agg)
      }
    }
  }

  const list: PokemonItemUsage[] = [...byKey.values()].map((agg) => {
    const items = [...agg.itemsByKey.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    return { name: agg.name, uses: agg.count, items: opts.itemsLimit ? items.slice(0, opts.itemsLimit) : items }
  })

  list.sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
  return opts.limit ? list.slice(0, opts.limit) : list
}

export function titleCase(value: string | null | undefined): string {
  return (value ?? "")
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export function computePlayerTopPokemon(
  sources: PlayerRosterSource[] | null | undefined,
  playerId: string,
  opts: { limit?: number } = {},
): PlayerPokemonStat[] {
  const key = normalizeKey(playerId)
  if (!key) return []

  const usesByKey = new Map<string, { name: string; count: number }>()
  const tournamentsByKey = new Map<string, { name: string; ids: Set<string> }>()

  for (const source of sources ?? []) {
    const tournamentId = source?.tournamentId
    const roster = source?.roster
    if (!tournamentId || !Array.isArray(roster)) continue

    const countedThisTournament = new Set<string>()
    for (const entry of roster) {
      if (normalizeKey(entry?.playerId) !== key) continue
      const team = entry?.team
      if (!Array.isArray(team)) continue
      for (const mon of team) {
        const name = pokemonName(mon)
        if (!name) continue
        const monKey = normalizeKey(name)

        const use = usesByKey.get(monKey) ?? { name, count: 0 }
        use.count += 1
        usesByKey.set(monKey, use)

        if (!countedThisTournament.has(monKey)) {
          countedThisTournament.add(monKey)
          const tourn = tournamentsByKey.get(monKey) ?? { name, ids: new Set<string>() }
          tourn.ids.add(tournamentId)
          tournamentsByKey.set(monKey, tourn)
        }
      }
    }
  }

  const list: PlayerPokemonStat[] = []
  for (const [monKey, use] of usesByKey) {
    list.push({ name: use.name, uses: use.count, tournaments: tournamentsByKey.get(monKey)?.ids.size ?? 0 })
  }

  list.sort((a, b) => b.uses - a.uses || b.tournaments - a.tournaments || a.name.localeCompare(b.name))
  return opts.limit ? list.slice(0, opts.limit) : list
}

export function computePlayerTopPokemonWithItems(
  sources: PlayerRosterSource[] | null | undefined,
  playerId: string,
  opts: { limit?: number; itemsLimit?: number } = {},
): PokemonItemUsage[] {
  const key = normalizeKey(playerId)
  if (!key) return []

  const byKey = new Map<string, { name: string; count: number; itemsByKey: Map<string, { name: string; count: number }> }>()

  for (const source of sources ?? []) {
    if (!source?.tournamentId || !Array.isArray(source.roster)) continue

    for (const entry of source.roster) {
      if (normalizeKey(entry?.playerId) !== key || !Array.isArray(entry.team)) continue

      for (const mon of entry.team) {
        const name = pokemonName(mon)
        if (!name) continue

        const monKey = normalizeKey(name)
        const aggregate = byKey.get(monKey) ?? {
          name,
          count: 0,
          itemsByKey: new Map<string, { name: string; count: number }>(),
        }
        aggregate.count += 1

        const item = typeof mon.item === "string" ? mon.item.trim() : ""
        if (item) {
          const itemKey = normalizeKey(item)
          const itemAggregate = aggregate.itemsByKey.get(itemKey) ?? { name: item, count: 0 }
          itemAggregate.count += 1
          aggregate.itemsByKey.set(itemKey, itemAggregate)
        }

        byKey.set(monKey, aggregate)
      }
    }
  }

  const list = [...byKey.values()].map((aggregate) => ({
    name: aggregate.name,
    uses: aggregate.count,
    items: [...aggregate.itemsByKey.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, opts.itemsLimit ?? 3),
  }))

  list.sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
  return opts.limit ? list.slice(0, opts.limit) : list
}
