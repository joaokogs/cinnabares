import { auth } from "@/lib/auth"
import { postCommentExists, toggleCommentLike } from "@/lib/posts/queries"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { id, commentId } = await params
  if (!await postCommentExists(id, commentId)) return Response.json({ error: "Esse comentário não existe neste post." }, { status: 404 })

  const active = await toggleCommentLike(commentId, session.user.id)
  return Response.json({ active })
}
