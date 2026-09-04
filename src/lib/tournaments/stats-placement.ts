import { normalizeKey } from "./stats-shared"

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

function findMaxPhase(matches: BracketMatchLike[]): number {
  let maxPhase = -Infinity
  for (const match of matches) {
    const phase = typeof match?.phase === "number" ? match.phase : NaN
    if (!Number.isNaN(phase) && phase > maxPhase) maxPhase = phase
  }
  return maxPhase
}

function isFinalWinner(matches: BracketMatchLike[], maxPhase: number, registrationKey: string): boolean {
  const finalMatch = matches.find((match) => match?.phase === maxPhase && match?.status === "completed")
  return !!finalMatch && normalizeKey(finalMatch.winnerRegistrationId) === registrationKey
}

function isRelevantMatch(match: BracketMatchLike, registrationKey: string): boolean {
  return normalizeKey(match?.slot1RegistrationId) === registrationKey || normalizeKey(match?.slot2RegistrationId) === registrationKey
}

function isCompletedLoss(match: BracketMatchLike, registrationKey: string): boolean {
  if (match?.status !== "completed") return false
  return normalizeKey(match.winnerRegistrationId) !== registrationKey
}

function matchPhase(match: BracketMatchLike): number {
  return typeof match.phase === "number" ? match.phase : NaN
}

function findElimination(
  matches: BracketMatchLike[],
  registrationKey: string,
  maxPhase: number,
): { isFinalLoser: boolean; eliminatedPhase: number | null; everPlayed: boolean } {
  let isFinalLoser = false
  let eliminatedPhase: number | null = null
  let everPlayed = false

  for (const match of matches) {
    if (!isRelevantMatch(match, registrationKey)) continue
    everPlayed = true
    if (!isCompletedLoss(match, registrationKey)) continue

    const phase = matchPhase(match)
    if (Number.isNaN(phase)) continue

    if (phase === maxPhase) {
      isFinalLoser = true
    } else if (eliminatedPhase === null || phase > eliminatedPhase) {
      eliminatedPhase = phase
    }
  }

  return { isFinalLoser, eliminatedPhase, everPlayed }
}

function placementFromElimination(maxPhase: number, eliminatedPhase: number): Placement {
  const k = maxPhase - eliminatedPhase
  const lower = 2 ** k + 1
  const upper = 2 ** (k + 1)
  return { rank: lower, label: `${lower}º-${upper}º` }
}

export function derivePlacement(
  matches: BracketMatchLike[] | null | undefined,
  registrationId: string | null | undefined,
): Placement {
  const id = normalizeKey(registrationId)
  if (!id || !Array.isArray(matches) || matches.length === 0) {
    return { rank: null, label: "Em andamento" }
  }

  const maxPhase = findMaxPhase(matches)
  if (Number.isNaN(maxPhase)) return { rank: null, label: "Em andamento" }

  if (isFinalWinner(matches, maxPhase, id)) {
    return { rank: 1, label: "1º" }
  }

  const elimination = findElimination(matches, id, maxPhase)
  if (elimination.isFinalLoser) return { rank: 2, label: "2º" }

  if (elimination.eliminatedPhase !== null) {
    return placementFromElimination(maxPhase, elimination.eliminatedPhase)
  }

  if (elimination.everPlayed) return { rank: null, label: "Em andamento" }

  return { rank: null, label: "Em andamento" }
}