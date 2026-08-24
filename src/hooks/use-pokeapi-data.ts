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

const API_URL = "https://pokeapi.co/api/v2"
let pokemonPromise: Promise<PokeOption[]> | null = null
let itemPromise: Promise<PokeOption[]> | null = null

function getResourceId(url: string) {
  return url.match(/\/(\d+)\/?$/)?.[1] ?? ""
}

async function fetchResources(resource: "pokemon" | "item") {
  const response = await fetch(`${API_URL}/${resource}?limit=10000`)
  if (!response.ok) throw new Error("PokeAPI indisponível")

  const data = (await response.json()) as ResourceList
  return data.results.map(({ name, url }) => ({
    name,
    iconUrl:
      resource === "pokemon"
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getResourceId(url)}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${encodeURIComponent(name)}.png`,
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
