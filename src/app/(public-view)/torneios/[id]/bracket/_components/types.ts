import type { VisibleRosterEntry } from "@/lib/tournaments/roster"

export type Visibility = "blind" | "partial" | "total"

export type Match = {
  id: string
  phase: number
  position: number
  slot1RegistrationId: string | null
  slot2RegistrationId: string | null
  winnerRegistrationId: string | null
  score1: number
  score2: number
  status: "pending" | "completed"
  slot1Name: string
  slot1GuildTag: string | null
  slot1Roster: VisibleRosterEntry[]
  slot2Name: string
  slot2GuildTag: string | null
  slot2Roster: VisibleRosterEntry[]
  winnerName: string | null
}

export type BracketData = {
  tournament: { name: string; status: string; visibility: Visibility }
  totalPhases: number
  matches: Match[]
  champion: { registrationId: string | null; name: string | null } | null
}

export type ConfirmAction = {
  type: "resolve" | "revert"
  matchId: string
  label: string
  winnerRegistrationId?: string
  loserScore?: 0 | 1 | 2
}