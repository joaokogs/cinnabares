import type { TournamentRosterEntry } from "@/db/schema"

export type VisibleRosterEntry = Pick<TournamentRosterEntry, "team">
export type TournamentVisibility = "blind" | "partial" | "total"

export function getVisibleRoster(roster: TournamentRosterEntry[], visibility: TournamentVisibility): VisibleRosterEntry[] {
  if (visibility === "blind") return []

  return roster.map(({ team }) => ({
    team: visibility === "partial" ? team?.map(({ name }) => ({ name })) : team,
  }))
}
