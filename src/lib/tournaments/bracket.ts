export type BracketMatchInput = {
  phase: number
  position: number
  slot1RegistrationId: string | null
  slot2RegistrationId: string | null
}

function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function createMatchGrid(bracketSize: number): BracketMatchInput[] {
  const matches: BracketMatchInput[] = []
  const totalPhases = Math.log2(bracketSize)
  for (let phase = 0; phase < totalPhases; phase++) {
    const count = bracketSize / Math.pow(2, phase + 1)
    for (let position = 0; position < count; position++) {
      matches.push({ phase, position, slot1RegistrationId: null, slot2RegistrationId: null })
    }
  }
  return matches
}

export function generateBracketMatches(registrationIds: string[]): BracketMatchInput[] {
  const n = registrationIds.length
  const bracketSize = nextPowerOf2(n)
  const byes = bracketSize - n
  const firstRoundMatches = bracketSize / 2

  const shuffled = shuffleArray(registrationIds)
  const matches = createMatchGrid(bracketSize)

  const playMatches = (n - byes) / 2
  let idx = 0

  for (let pos = 0; pos < playMatches; pos++) {
    const match = matches[pos]
    match.slot1RegistrationId = shuffled[idx]
    idx++
    match.slot2RegistrationId = shuffled[idx]
    idx++
  }

  for (let pos = playMatches; pos < firstRoundMatches; pos++) {
    const match = matches[pos]
    match.slot1RegistrationId = shuffled[idx]
    idx++
  }

  return matches
}

export function getNextMatchSlot(position: number): "slot1" | "slot2" {
  return position % 2 === 0 ? "slot1" : "slot2"
}

export function getPhaseLabel(phase: number, totalPhases: number): string {
  const fromFinal = totalPhases - 1 - phase
  if (fromFinal === 0) return "Final"
  if (fromFinal === 1) return "Semifinal"
  if (fromFinal === 2) return "Quartas de Final"
  if (fromFinal === 3) return "Oitavas de Final"
  return `Fase ${phase + 1}`
}
