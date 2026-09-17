import type { BuildStat } from "@/hooks/use-pokemon-build-data"

export const NATURES: Record<string, { boost: BuildStat; reduce: BuildStat }> = {
  hardy: { boost: "atk", reduce: "atk" }, lonely: { boost: "atk", reduce: "def" }, brave: { boost: "atk", reduce: "spe" }, adamant: { boost: "atk", reduce: "spa" }, naughty: { boost: "atk", reduce: "spd" },
  bold: { boost: "def", reduce: "atk" }, docile: { boost: "def", reduce: "def" }, relaxed: { boost: "def", reduce: "spe" }, impish: { boost: "def", reduce: "spa" }, lax: { boost: "def", reduce: "spd" },
  timid: { boost: "spe", reduce: "atk" }, hasty: { boost: "spe", reduce: "def" }, serious: { boost: "spe", reduce: "spe" }, jolly: { boost: "spe", reduce: "spa" }, naive: { boost: "spe", reduce: "spd" },
  modest: { boost: "spa", reduce: "atk" }, mild: { boost: "spa", reduce: "def" }, quiet: { boost: "spa", reduce: "spe" }, bashful: { boost: "spa", reduce: "spa" }, rash: { boost: "spa", reduce: "spd" },
  calm: { boost: "spd", reduce: "atk" }, gentle: { boost: "spd", reduce: "def" }, sassy: { boost: "spd", reduce: "spe" }, careful: { boost: "spd", reduce: "spa" }, quirky: { boost: "spd", reduce: "spd" },
}

export const STAT_ORDER: Array<[BuildStat, string]> = [["hp", "HP"], ["atk", "Atk"], ["def", "Def"], ["spa", "SpA"], ["spd", "SpD"], ["spe", "Spe"]]

export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C", grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1", ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A", rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746", steel: "#B7B7CE", fairy: "#D685AD",
}

export function formatPokemonName(name: string) {
  return name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

export function natureEffect(nature: string, stat: BuildStat) {
  const modifier = NATURES[nature]
  if (!modifier || modifier.boost === modifier.reduce) return "neutral" as const
  if (modifier.boost === stat) return "boost" as const
  if (modifier.reduce === stat) return "reduce" as const
  return "neutral" as const
}

export function calculateBuildStat({ base, iv, ev, stat, nature, level = 50 }: { base: number; iv: number; ev: number; stat: BuildStat; nature: string; level?: number }) {
  const raw = stat === "hp"
    ? Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + level + 10)
    : Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + 5)
  const effect = natureEffect(nature, stat)
  return Math.floor(raw * (effect === "boost" ? 1.1 : effect === "reduce" ? 0.9 : 1))
}

export function maxBuildStat(base: number, stat: BuildStat, level = 50) {
  const raw = stat === "hp"
    ? Math.floor(((2 * base + 31 + 63) * level) / 100 + level + 10)
    : Math.floor(((2 * base + 31 + 63) * level) / 100 + 5)
  return stat === "hp" ? raw : Math.floor(raw * 1.1)
}
