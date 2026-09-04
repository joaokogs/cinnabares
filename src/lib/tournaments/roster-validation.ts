import type { TournamentRosterEntry, TournamentTier } from "@/db/schema"

type NamedResource = { name: string; url: string }
type ResourceList = { results: NamedResource[] }
type HoldableItemList = { items: NamedResource[] }

const POKE_API_URL = "https://pokeapi.co/api/v2"
const ITEM_SOURCE_ENDPOINTS = [
  "item-category/held-items/",
  "item-category/choice/",
  "item-category/type-enhancement/",
  "item-category/plates/",
  "item-category/bad-held-items/",
]
const BALL_CATEGORY_ENDPOINTS = [
  "item-category/standard-balls/",
  "item-category/special-balls/",
  "item-category/apricorn-balls/",
]
const BERRY_ENDPOINT = "berry?limit=1000"
const MAX_GEN_5_POKEMON_ID = 649

let allowedRosterValuesPromise: Promise<{ pokemon: Set<string>; items: Set<string> }> | null = null

function getResourceId(url: string) {
  return Number(url.match(/\/(\d+)\/?$/)?.[1] ?? Number.NaN)
}

async function fetchAllowedRosterValues() {
  const [pokemonResponse, ...itemAndBallResponses] = await Promise.all([
    fetch(`${POKE_API_URL}/pokemon?limit=10000`),
    ...ITEM_SOURCE_ENDPOINTS.map((endpoint) => fetch(`${POKE_API_URL}/${endpoint}`)),
    ...BALL_CATEGORY_ENDPOINTS.map((endpoint) => fetch(`${POKE_API_URL}/${endpoint}`)),
    fetch(`${POKE_API_URL}/${BERRY_ENDPOINT}`),
  ])
  if (!pokemonResponse.ok || itemAndBallResponses.some((response) => !response.ok)) throw new Error("PokeAPI indisponível")

  const berryResponse = itemAndBallResponses[itemAndBallResponses.length - 1]
  const categoryResponses = itemAndBallResponses.slice(0, ITEM_SOURCE_ENDPOINTS.length + BALL_CATEGORY_ENDPOINTS.length)
  const [pokemonData, ...itemAndBallData] = await Promise.all([
    pokemonResponse.json() as Promise<ResourceList>,
    ...categoryResponses.map((response) => response.json() as Promise<HoldableItemList>),
  ])
  const berryData = await berryResponse.json() as ResourceList
  const itemData = itemAndBallData.slice(0, ITEM_SOURCE_ENDPOINTS.length)
  const ballData = itemAndBallData.slice(ITEM_SOURCE_ENDPOINTS.length)
  const itemNames = new Set(itemData.flatMap(({ items }) => items.map(({ name }) => name)))
  const ballNames = new Set(ballData.flatMap(({ items }) => items.map(({ name }) => name)))
  for (const { name } of berryData.results) itemNames.add(`${name}-berry`)

  return {
    pokemon: new Set(pokemonData.results.filter(({ url }) => getResourceId(url) <= MAX_GEN_5_POKEMON_ID).map(({ name }) => name)),
    items: new Set([...itemNames].filter((name) => !ballNames.has(name))),
  }
}

function loadAllowedRosterValues() {
  allowedRosterValuesPromise ??= fetchAllowedRosterValues().catch((error) => {
    allowedRosterValuesPromise = null
    throw error
  })
  return allowedRosterValuesPromise
}

export function normalizeRoster(value: unknown): TournamentRosterEntry[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => {
    const item = entry as Record<string, unknown>
    const team = Array.isArray(item.team)
      ? item.team.map((pokemon) => {
          const current = pokemon as Record<string, unknown>
          return { name: typeof current.name === "string" ? current.name.trim().toLowerCase() : "", item: typeof current.item === "string" ? current.item.trim().toLowerCase() : undefined }
        })
      : undefined
    return { playerId: typeof item.playerId === "string" ? item.playerId : "", tier: typeof item.tier === "string" ? item.tier as TournamentTier : "random", team }
  })
}

export type RosterValidationConfig = {
  visibility: "blind" | "partial" | "total"
  expectedSize: number
  allowedTiers: TournamentTier[]
  tierRules: Partial<Record<TournamentTier, number>>
}

function tierCountsMatch(roster: TournamentRosterEntry[], allowedTiers: TournamentTier[], tierRules: Partial<Record<TournamentTier, number>>, expectedSize: number) {
  const tierCounts = new Map<TournamentTier, number>()
  for (const entry of roster) tierCounts.set(entry.tier, (tierCounts.get(entry.tier) ?? 0) + 1)
  return allowedTiers.every((tier) => (tierCounts.get(tier) ?? 0) === (tierRules[tier] ?? (expectedSize === 1 ? 1 : 0)))
}

function hasInvalidTeam(roster: TournamentRosterEntry[], visibility: "blind" | "partial" | "total") {
  if (visibility === "blind") return false
  return roster.some((entry) => !entry.team || entry.team.length !== 6 || entry.team.some((pokemon) => !pokemon.name))
}

function hasMissingItems(roster: TournamentRosterEntry[]) {
  return roster.some((entry) => entry.team?.some((pokemon) => !pokemon.item))
}

function hasOutOfGenPokemon(roster: TournamentRosterEntry[], allowedPokemon: Set<string>) {
  return roster.some((entry) => entry.team?.some((pokemon) => !allowedPokemon.has(pokemon.name.toLowerCase())))
}

function hasInvalidItems(roster: TournamentRosterEntry[], allowedItems: Set<string>) {
  return roster.some((entry) => entry.team?.some((pokemon) => pokemon.item && !allowedItems.has(pokemon.item.toLowerCase())))
}

async function validateAllowedRoster(roster: TournamentRosterEntry[], visibility: "blind" | "partial" | "total"): Promise<string | null> {
  let allowedValues: Awaited<ReturnType<typeof loadAllowedRosterValues>>
  try {
    allowedValues = await loadAllowedRosterValues()
  } catch {
    return "Não foi possível validar os Pokémon e itens agora. Tente novamente em instantes."
  }

  if (hasOutOfGenPokemon(roster, allowedValues.pokemon)) return "A escalação contém um Pokémon fora das gerações permitidas."
  if (visibility === "total" && hasInvalidItems(roster, allowedValues.items)) return "A escalação contém um item que não pode ser usado em batalha."
  return null
}

export async function validateRoster(roster: TournamentRosterEntry[], config: RosterValidationConfig): Promise<string | null> {
  const { visibility, expectedSize, allowedTiers, tierRules } = config

  if (visibility === "blind" && expectedSize === 1 && roster.length === 0) return null
  if (roster.length !== expectedSize) return `A inscrição precisa escalar ${expectedSize} player${expectedSize === 1 ? "" : "s"}.`
  if (roster.some((entry) => !entry.playerId || !allowedTiers.includes(entry.tier))) return "Há um player ou tier inválido na escalação."
  if (!tierCountsMatch(roster, allowedTiers, tierRules, expectedSize)) return "A escalação não respeita a composição de tiers do torneio."
  if (hasInvalidTeam(roster, visibility)) return "Cada player deve informar exatamente 6 Pokémon."
  if (visibility === "total" && hasMissingItems(roster)) return "Cada Pokémon precisa informar um item nesta modalidade."
  if (visibility === "blind") return null

  return validateAllowedRoster(roster, visibility)
}