import { auth } from "@/lib/auth"
import { postExists, togglePostAction, type PostAction } from "@/lib/posts/queries"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { id } = await params
  if (!await postExists(id)) return Response.json({ error: "Esse post não existe mais." }, { status: 404 })

  let body: { action?: string }
  try {
    body = await request.json() as { action?: string }
  } catch {
    return Response.json({ error: "Ação inválida." }, { status: 400 })
  }

  if (body.action !== "like" && body.action !== "repost" && body.action !== "bookmark") {
    return Response.json({ error: "Ação inválida." }, { status: 400 })
  }

  const active = await togglePostAction(id, session.user.id, body.action as PostAction)
  return Response.json({ active })
}
