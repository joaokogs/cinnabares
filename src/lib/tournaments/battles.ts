import type { MatchBattle } from "@/db/schema"
import type { VisibleRosterEntry } from "@/lib/tournaments/roster"

const MAX_BATTLES = 5

export function buildDefaultBattles(slot1Roster: VisibleRosterEntry[], slot2Roster: VisibleRosterEntry[]): MatchBattle[] {
  const availableSlot2 = [...slot2Roster]
  const battles: MatchBattle[] = []
  for (const slot1Player of slot1Roster) {
    if (battles.length >= MAX_BATTLES) break
    const slot2Index = availableSlot2.findIndex((slot2Player) => slot2Player.tier === slot1Player.tier)
    if (slot2Index < 0) continue
    const [slot2Player] = availableSlot2.splice(slot2Index, 1)
    battles.push({ slot1PlayerId: slot1Player.playerId, slot2PlayerId: slot2Player.playerId, winnerPlayerId: null })
  }
  return battles
}

function hasPlayer(playerId: string | null, rosterIds: Set<string>): playerId is string {
  return typeof playerId === "string" && rosterIds.has(playerId)
}

function hasInvalidWinner(battle: MatchBattle): boolean {
  return Boolean(battle.winnerPlayerId) && battle.winnerPlayerId !== battle.slot1PlayerId && battle.winnerPlayerId !== battle.slot2PlayerId
}

function validateBattleEntry({ battle, index, slot1Roster, slot2Roster, slot1Ids, slot2Ids, usedSlot1Ids, usedSlot2Ids }: { battle: MatchBattle; index: number; slot1Roster: Pick<VisibleRosterEntry, "playerId" | "tier">[]; slot2Roster: Pick<VisibleRosterEntry, "playerId" | "tier">[]; slot1Ids: Set<string>; slot2Ids: Set<string>; usedSlot1Ids: Set<string>; usedSlot2Ids: Set<string> }): string | null {
  if (!battle || typeof battle !== "object") return `Informe uma batalha válida na posição ${index + 1}.`
  if (!hasPlayer(battle.slot1PlayerId, slot1Ids)) return `Selecione um player válido do primeiro time na batalha ${index + 1}.`
  if (!hasPlayer(battle.slot2PlayerId, slot2Ids)) return `Selecione um player válido do segundo time na batalha ${index + 1}.`
  if (usedSlot1Ids.has(battle.slot1PlayerId)) return "O player do primeiro time já está em outra batalha."
  if (usedSlot2Ids.has(battle.slot2PlayerId)) return "O player do segundo time já está em outra batalha."
  const slot1Player = slot1Roster.find((entry) => entry.playerId === battle.slot1PlayerId)
  const slot2Player = slot2Roster.find((entry) => entry.playerId === battle.slot2PlayerId)
  if (slot1Player?.tier !== slot2Player?.tier) return `A batalha ${index + 1} só pode colocar players da mesma categoria para lutar.`
  usedSlot1Ids.add(battle.slot1PlayerId)
  usedSlot2Ids.add(battle.slot2PlayerId)
  if (hasInvalidWinner(battle)) return `O vencedor da batalha ${index + 1} precisa ser um dos dois players selecionados.`
  return null
}

export function validateBattles(battles: MatchBattle[], slot1Roster: Pick<VisibleRosterEntry, "playerId" | "tier">[], slot2Roster: Pick<VisibleRosterEntry, "playerId" | "tier">[]): string | null {
  if (battles.length < 1 || battles.length > MAX_BATTLES) return "A ordem precisa ter entre 1 e 5 batalhas."

  const slot1Ids = new Set(slot1Roster.map((entry) => entry.playerId))
  const slot2Ids = new Set(slot2Roster.map((entry) => entry.playerId))
  const usedSlot1Ids = new Set<string>()
  const usedSlot2Ids = new Set<string>()

  for (const [index, battle] of battles.entries()) {
    const error = validateBattleEntry({ battle, index, slot1Roster, slot2Roster, slot1Ids, slot2Ids, usedSlot1Ids, usedSlot2Ids })
    if (error) return error
  }

  return null
}

export function validateBattleResults({ battles, slot1Roster, slot2Roster, score1, score2 }: {
  battles: MatchBattle[]
  slot1Roster: Pick<VisibleRosterEntry, "playerId" | "tier">[]
  slot2Roster: Pick<VisibleRosterEntry, "playerId" | "tier">[]
  score1: number
  score2: number
}): string | null {
  const orderError = validateBattles(battles, slot1Roster, slot2Roster)
  if (orderError) return orderError
  const completedBattles = battles.filter((battle) => battle.winnerPlayerId)
  if (completedBattles.length !== score1 + score2) return "Registre o vencedor de cada duelo realizado para que o placar seja validado."

  const slot1Ids = new Set(slot1Roster.map((entry) => entry.playerId))
  const slot1Wins = completedBattles.filter((battle) => battle.winnerPlayerId && slot1Ids.has(battle.winnerPlayerId)).length
  const slot2Wins = completedBattles.length - slot1Wins
  if (slot1Wins !== score1 || slot2Wins !== score2) {
    return "O placar da série precisa corresponder aos vencedores registrados em cada batalha."
  }

  return null
}

export function battleWinnerStatus(battles: MatchBattle[], playerId: string): "winner" | "loser" | null {
  const played = battles.filter((battle) => battle.slot1PlayerId === playerId || battle.slot2PlayerId === playerId)
  if (played.length === 0) return null
  const won = played.some((battle) => battle.winnerPlayerId === playerId)
  return won ? "winner" : played.every((battle) => battle.winnerPlayerId !== null) ? "loser" : null
}

export function maxBattles(): number {
  return MAX_BATTLES
}
