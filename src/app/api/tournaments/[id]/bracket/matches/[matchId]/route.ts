import { getAdminSession } from "@/lib/tournaments/auth"
import type { MatchBattle } from "@/db/schema"
import { resolveMatch, revertMatch, saveBattleOrder } from "@/lib/tournaments/match-actions"

type RouteProps = { params: Promise<{ id: string; matchId: string }> }

export async function PATCH(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id, matchId } = await params
  const body = await request.json() as { battles?: MatchBattle[]; winnerRegistrationId?: string }
  if (Array.isArray(body.battles) && body.winnerRegistrationId) {
    return Response.json({ error: "Escolha entre salvar a ordem ou finalizar a partida." }, { status: 400 })
  }
  const result = Array.isArray(body.battles)
    ? await saveBattleOrder(id, matchId, admin.session.user.id, body.battles)
    : await resolveMatch(id, matchId, admin.session.user.id, body)
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })

  if (result.ok && "winnerRegistrationId" in result) {
    const resolved = result as unknown as { winnerRegistrationId: string; score1: number; score2: number; finished: boolean }
    return Response.json({
      winnerRegistrationId: resolved.winnerRegistrationId,
      score1: resolved.score1,
      score2: resolved.score2,
      finished: resolved.finished,
    })
  }

  if (result.ok && "reopened" in result) return Response.json({ saved: true, reopened: true })
  return Response.json({ saved: true })
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id, matchId } = await params
  const result = await revertMatch(id, matchId, admin.session.user.id)
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })

  return Response.json({ reverted: true, matchId })
}
