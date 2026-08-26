import { auth } from "@/lib/auth"
import { canViewTournamentParticipants } from "@/lib/tournaments/auth"
import { getTournament, listApprovedTournamentParticipants } from "@/lib/tournaments/queries"
import { getVisibleRoster } from "@/lib/tournaments/roster"

type RouteProps = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteProps) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Entre na sua conta para ver os inscritos." }, { status: 401 })

  const { id } = await params
  const currentTournament = await getTournament(id)
  if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })
  if (currentTournament.status !== "open" && currentTournament.status !== "closed") return Response.json([])
  if (!await canViewTournamentParticipants(id, session.user.id)) {
    return Response.json({ error: "Somente inscritos aprovados podem ver os participantes." }, { status: 403 })
  }

  const participants = await listApprovedTournamentParticipants(id)
  return Response.json(participants.map((participant) => ({
    ...participant,
    roster: getVisibleRoster(participant.roster, currentTournament.visibility),
  })))
}
