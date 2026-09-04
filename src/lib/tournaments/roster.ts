import type { TournamentRosterEntry } from "@/db/schema"

export type RosterUser = { id: string; username: string | null; name: string | null }

export type VisibleRosterEntry = Pick<TournamentRosterEntry, "playerId" | "tier"> & {
  playerName: string
  team: TournamentRosterEntry["team"]
}

export type TournamentVisibility = "blind" | "partial" | "total"

export function getVisibleRoster(
  roster: TournamentRosterEntry[],
  visibility: TournamentVisibility,
  users?: Map<string, RosterUser>,
): VisibleRosterEntry[] {
  if (visibility === "blind") return []

  return roster.map((entry) => {
    const player = users?.get(entry.playerId)
    return {
      playerId: entry.playerId,
      playerName: player?.username ?? player?.name ?? "Jogador",
      tier: entry.tier,
      team: visibility === "partial" ? entry.team?.map(({ name }) => ({ name })) : entry.team,
    }
  })
}
