import type { TournamentRosterEntry } from "@/db/schema"
import { auth } from "@/lib/auth"
import { canViewTournamentParticipants, getAdminSession } from "@/lib/tournaments/auth"
import { startTournamentBracket } from "@/lib/tournaments/bracket-build"
import { getBracketByTournamentId, getBracketMatchesWithRegistrations, getTournament, getUsersByIds } from "@/lib/tournaments/queries"
import { getVisibleRoster } from "@/lib/tournaments/roster"

type RouteProps = { params: Promise<{ id: string }> }

function safeRoster(raw: unknown): TournamentRosterEntry[] {
  if (!Array.isArray(raw)) return []
  return raw as TournamentRosterEntry[]
}

export async function GET(request: Request, { params }: RouteProps) {
  const { id } = await params
  const currentTournament = await getTournament(id)
  if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Entre na sua conta para ver a chave." }, { status: 401 })
  if (!await canViewTournamentParticipants(id, session.user.id)) {
    return Response.json({ error: "Somente inscritos aprovados podem ver a chave do torneio." }, { status: 403 })
  }

  const admin = await getAdminSession(request.headers)
  const viewerIsAdmin = Boolean(admin.session)

  const currentBracket = await getBracketByTournamentId(id)
  if (!currentBracket) return Response.json({ error: "A chave ainda não foi iniciada." }, { status: 404 })

  const matches = await getBracketMatchesWithRegistrations(currentBracket.id)
  const totalPhases = matches.length > 0 ? Math.max(...matches.map((m) => m.phase)) + 1 : 0

  const champion = matches.find((m) => m.phase === totalPhases - 1 && m.status === "completed")

  const playerIds = matches.flatMap((m) => [
    ...safeRoster(m.slot1Roster).map((entry) => entry.playerId),
    ...safeRoster(m.slot2Roster).map((entry) => entry.playerId),
  ])
  const users = await getUsersByIds(playerIds)

  return Response.json({
    tournament: { name: currentTournament.name, status: currentTournament.status, visibility: currentTournament.visibility },
    totalPhases,
    matches: matches.map((m) => ({
      ...m,
      battles: viewerIsAdmin || currentTournament.visibility !== "blind" ? m.battles : [],
      slot1Roster: viewerIsAdmin ? getVisibleRoster(safeRoster(m.slot1Roster), "total", users) : getVisibleRoster(safeRoster(m.slot1Roster), currentTournament.visibility, users),
      slot2Roster: viewerIsAdmin ? getVisibleRoster(safeRoster(m.slot2Roster), "total", users) : getVisibleRoster(safeRoster(m.slot2Roster), currentTournament.visibility, users),
    })),
    viewerIsAdmin,
    champion: champion ? { registrationId: champion.winnerRegistrationId, name: champion.winnerName } : null,
  })
}

export async function POST(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id } = await params
  const result = await startTournamentBracket(id)
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
  return Response.json({ bracketId: result.bracketId }, { status: 201 })
}
