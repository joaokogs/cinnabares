import { auth } from "@/lib/auth"
import { markNotificationsRead } from "@/lib/notifications/queries"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou." }, { status: 401 })

  await markNotificationsRead(session.user.id)
  return Response.json({ ok: true })
}
