"use client"

import { useEffect, useState } from "react"

export type BuildStat = "hp" | "atk" | "def" | "spa" | "spd" | "spe"

export type PokemonBuildData = {
  id: number
  displayName: string
  spriteUrl: string
  types: string[]
  abilities: string[]
  moves: string[]
  baseStats: Record<BuildStat, number>
}

const API_URL = "https://pokeapi.co/api/v2"
const STAT_NAMES: BuildStat[] = ["hp", "atk", "def", "spa", "spd", "spe"]
const STAT_MAP: Record<string, BuildStat> = {
  hp: "hp",
  attack: "atk",
  defense: "def",
  "special-attack": "spa",
  "special-defense": "spd",
  speed: "spe",
}
const buildDataCache = new Map<string, PokemonBuildData>()
const buildDataPromises = new Map<string, Promise<PokemonBuildData>>()

function displayName(name: string) {
  return name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

async function fetchBuildData(name: string) {
  const response = await fetch(`${API_URL}/pokemon/${encodeURIComponent(name)}`)
  if (!response.ok) throw new Error("Pokémon não encontrado")
  const data = await response.json() as {
    id: number
    name: string
    types: Array<{ type: { name: string } }>
    abilities: Array<{ ability: { name: string } }>
    moves: Array<{ move: { name: string } }>
    stats: Array<{ base_stat: number; stat: { name: string } }>
  }
  const baseStats = Object.fromEntries(STAT_NAMES.map((stat) => [stat, 0])) as Record<BuildStat, number>
  for (const stat of data.stats) {
    const key = STAT_MAP[stat.stat.name]
    if (key) baseStats[key] = stat.base_stat
  }
  return {
    id: data.id,
    displayName: displayName(data.name),
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`,
    types: data.types.map(({ type }) => type.name),
    abilities: data.abilities.map(({ ability }) => ability.name),
    moves: data.moves.map(({ move }) => move.name),
    baseStats,
  }
}

function loadBuildData(name: string) {
  const cached = buildDataCache.get(name)
  if (cached) return Promise.resolve(cached)
  const current = buildDataPromises.get(name)
  if (current) return current
  const promise = fetchBuildData(name).then((data) => {
    buildDataCache.set(name, data)
    buildDataPromises.delete(name)
    return data
  }).catch((error) => {
    buildDataPromises.delete(name)
    throw error
  })
  buildDataPromises.set(name, promise)
  return promise
}

export function usePokemonBuildData(name: string) {
  const [data, setData] = useState<PokemonBuildData | null>(() => buildDataCache.get(name) ?? null)
  const [loadedName, setLoadedName] = useState(() => name && buildDataCache.has(name) ? name : "")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!name || buildDataCache.has(name)) return
    let active = true
    loadBuildData(name).then((nextData) => {
      if (active) {
        setData(nextData)
        setLoadedName(name)
      }
    }).catch(() => {
      if (active) {
        setError("Não foi possível carregar os dados deste Pokémon.")
      }
    })
    return () => { active = false }
  }, [name])

  const currentData = name ? buildDataCache.get(name) ?? (loadedName === name ? data : null) : null
  const currentError = loadedName === name ? error : null
  return {
    data: currentData,
    loading: Boolean(name) && !currentData && loadedName !== name && !currentError,
    error: currentError,
  }
}
