import { getAdminSession } from "@/lib/tournaments/auth"
import { listBracketHistory } from "@/lib/tournaments/history"
import { getBracketByTournamentId } from "@/lib/tournaments/queries"

type RouteProps = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(_request.headers)
  if (admin.response) return admin.response

  const { id } = await params
  const currentBracket = await getBracketByTournamentId(id)
  if (!currentBracket) return Response.json({ error: "A chave deste torneio não foi iniciada." }, { status: 404 })

  return Response.json(await listBracketHistory(currentBracket.id))
}