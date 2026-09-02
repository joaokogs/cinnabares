export const POINTS_PER_PLACEMENT: Readonly<Record<number, number>> = {
  1: 100,
  2: 60,
  3: 30,
  5: 15,
}

export const POINTS_RULE_LABEL = "1º=100 · 2º=60 · 3º-4º=30 · 5º-8º=15"

export function pointsForRank(rank: number | null | undefined): number {
  if (rank == null) return 0
  return POINTS_PER_PLACEMENT[rank] ?? 0
}

export type PointsResultInput = {
  result: string
  placementRank: number | null
}

export function pointsForResult(result: PointsResultInput | null | undefined): number {
  if (!result) return 0
  if (result.result !== "champion" && result.result !== "eliminated") return 0
  return pointsForRank(result.placementRank)
}

export type PointsSummary = {
  total: number
  tournaments: number
}

export function computePoints(results: PointsResultInput[] | null | undefined): PointsSummary {
  let total = 0
  let tournaments = 0
  for (const result of results ?? []) {
    const points = pointsForResult(result)
    if (points > 0) {
      total += points
      tournaments += 1
    }
  }
  return { total, tournaments }
}

export type PointsRankingEntry = {
  id: string
  name: string
  tag?: string | null
  total: number
  tournaments: number
}

export function sortPointsRanking<T extends { total: number; name: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
}