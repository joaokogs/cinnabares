"use client"

import { useEffect, useState } from "react"

export type PokeOption = {
  name: string
  iconUrl?: string
}

export type NamedOption = {
  name: string
}

export const HIDDEN_POWER_MOVES = [
  "hidden-power",
  "hidden-power-bug",
  "hidden-power-dark",
  "hidden-power-dragon",
  "hidden-power-electric",
  "hidden-power-fighting",
  "hidden-power-fire",
  "hidden-power-flying",
  "hidden-power-ghost",
  "hidden-power-grass",
  "hidden-power-ground",
  "hidden-power-ice",
  "hidden-power-poison",
  "hidden-power-psychic",
  "hidden-power-rock",
  "hidden-power-steel",
  "hidden-power-water",
] as const

export function getHiddenPowerType(name: string) {
  const normalized = name.toLowerCase()
  if (normalized === "hidden-power") return "normal"
  const match = normalized.match(/^hidden-power-(bug|dark|dragon|electric|fighting|fire|flying|ghost|grass|ground|ice|poison|psychic|rock|steel|water)$/)
  return match?.[1]
}

type NamedResource = {
  name: string
  url: string
}

type ResourceList = {
  results: NamedResource[]
}

type HoldableItemList = {
  items: NamedResource[]
}

const API_URL = "https://pokeapi.co/api/v2"
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
let pokemonPromise: Promise<PokeOption[]> | null = null
let itemPromise: Promise<PokeOption[]> | null = null
let abilityPromise: Promise<NamedOption[]> | null = null
let naturePromise: Promise<NamedOption[]> | null = null
let movePromise: Promise<NamedOption[]> | null = null

function getResourceId(url: string) {
  return Number(url.match(/\/(\d+)\/?$/)?.[1] ?? Number.NaN)
}

async function fetchResources(resource: "pokemon" | "item") {
  if (resource === "item") {
    const [responses, berryResponse] = await Promise.all([
      Promise.all([
        ...ITEM_SOURCE_ENDPOINTS.map((endpoint) => fetch(`${API_URL}/${endpoint}`)),
        ...BALL_CATEGORY_ENDPOINTS.map((endpoint) => fetch(`${API_URL}/${endpoint}`)),
      ]),
      fetch(`${API_URL}/${BERRY_ENDPOINT}`),
    ])
    if (responses.some((response) => !response.ok) || !berryResponse.ok) throw new Error("PokeAPI indisponível")

    const [data, berryData] = await Promise.all([
      Promise.all(responses.map((response) => response.json() as Promise<HoldableItemList>)),
      berryResponse.json() as Promise<ResourceList>,
    ])
    const itemNames = new Map(data.slice(0, ITEM_SOURCE_ENDPOINTS.length).flatMap(({ items }) => items).map((item) => [item.name, item]))
    const ballNames = new Set(data.slice(ITEM_SOURCE_ENDPOINTS.length).flatMap(({ items }) => items.map(({ name }) => name)))
    for (const { name } of berryData.results) itemNames.set(`${name}-berry`, { name: `${name}-berry`, url: "" })
    return [...itemNames.values()].filter(({ name }) => !ballNames.has(name)).map(({ name }) => ({
      name,
      iconUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(name)}.png`,
    }))
  }

  const response = await fetch(`${API_URL}/pokemon?limit=10000`)
  if (!response.ok) throw new Error("PokeAPI indisponível")

  const data = await response.json() as ResourceList
  const resources = data.results.filter(({ url }) => getResourceId(url) <= MAX_GEN_5_POKEMON_ID)

  return resources.map(({ name, url }) => ({
    name,
    iconUrl:
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getResourceId(url)}.png`,
  }))
}

async function fetchNamedResources(endpoint: "ability" | "nature" | "move") {
  const response = await fetch(`${API_URL}/${endpoint}?limit=2000`)
  if (!response.ok) throw new Error("PokéAPI indisponível")
  const data = await response.json() as ResourceList
  const names = data.results.map(({ name }) => name)
  const allNames = endpoint === "move" ? Array.from(new Set([...names, ...HIDDEN_POWER_MOVES])) : names
  return allNames.map((name) => ({ name }))
}

function loadResources(resource: "pokemon" | "item") {
  if (resource === "pokemon") {
    pokemonPromise ??= fetchResources(resource).catch((error) => {
      pokemonPromise = null
      throw error
    })
    return pokemonPromise
  }

  itemPromise ??= fetchResources(resource).catch((error) => {
    itemPromise = null
    throw error
  })
  return itemPromise
}

function loadNamedResources(resource: "ability" | "nature" | "move") {
  if (resource === "ability") {
    abilityPromise ??= fetchNamedResources(resource).catch((error) => {
      abilityPromise = null
      throw error
    })
    return abilityPromise
  }

  if (resource === "nature") {
    naturePromise ??= fetchNamedResources(resource).catch((error) => {
      naturePromise = null
      throw error
    })
    return naturePromise
  }

  movePromise ??= fetchNamedResources(resource).catch((error) => {
    movePromise = null
    throw error
  })
  return movePromise
}

export function usePokeApiData() {
  const [pokemon, setPokemon] = useState<PokeOption[]>([])
  const [items, setItems] = useState<PokeOption[]>([])
  const [abilities, setAbilities] = useState<NamedOption[]>([])
  const [natures, setNatures] = useState<NamedOption[]>([])
  const [moves, setMoves] = useState<NamedOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([
      loadResources("pokemon"),
      loadResources("item"),
      loadNamedResources("ability"),
      loadNamedResources("nature"),
      loadNamedResources("move"),
    ])
      .then(([pokemonOptions, itemOptions, abilityOptions, natureOptions, moveOptions]) => {
        if (!active) return
        setPokemon(pokemonOptions)
        setItems(itemOptions)
        setAbilities(abilityOptions)
        setNatures(natureOptions)
        setMoves(moveOptions)
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar as sugestões da PokéAPI.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { pokemon, items, abilities, natures, moves, loading, error }
}
