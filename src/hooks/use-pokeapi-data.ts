"use client"

import { useEffect, useState } from "react"

export type PokeOption = {
  name: string
  iconUrl: string
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

export function usePokeApiData() {
  const [pokemon, setPokemon] = useState<PokeOption[]>([])
  const [items, setItems] = useState<PokeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([loadResources("pokemon"), loadResources("item")])
      .then(([pokemonOptions, itemOptions]) => {
        if (!active) return
        setPokemon(pokemonOptions)
        setItems(itemOptions)
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

  return { pokemon, items, loading, error }
}
