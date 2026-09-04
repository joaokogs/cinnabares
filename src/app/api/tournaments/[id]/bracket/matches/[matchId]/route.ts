import { getAdminSession } from "@/lib/tournaments/auth"
import { resolveMatch, revertMatch } from "@/lib/tournaments/match-actions"

type RouteProps = { params: Promise<{ id: string; matchId: string }> }

export async function PATCH(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id, matchId } = await params
  const result = await resolveMatch(id, matchId, admin.session.user.id, await request.json())
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })

  return Response.json({
    winnerRegistrationId: result.winnerRegistrationId,
    score1: result.score1,
    score2: result.score2,
    finished: result.finished,
  })
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id, matchId } = await params
  const result = await revertMatch(id, matchId, admin.session.user.id)
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })

  return Response.json({ reverted: true, matchId })
}