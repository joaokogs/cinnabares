import { auth } from "@/lib/auth"
import { toggleCommentPin } from "@/lib/posts/queries"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { id, commentId } = await params
  const pinned = await toggleCommentPin(id, commentId, session.user.id)
  if (pinned === null) return Response.json({ error: "Apenas o criador do post pode fixar este comentário." }, { status: 403 })

  return Response.json({ pinned })
}
