import { auth } from "@/lib/auth"
import { createNotification } from "@/lib/notifications/queries"
import { createPostComment, getCommentAuthorId, getPostAuthorId, postCommentExists, postExists } from "@/lib/posts/queries"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para comentar." }, { status: 401 })

  const { id } = await params
  if (!await postExists(id)) return Response.json({ error: "Esse post não existe mais." }, { status: 404 })

  let body: { body?: string; parentId?: string }
  try {
    body = await request.json() as { body?: string; parentId?: string }
  } catch {
    return Response.json({ error: "Comentário inválido." }, { status: 400 })
  }

  const comment = String(body.body ?? "").trim()
  if (!comment || comment.length > 1000) {
    return Response.json({ error: "O comentário deve ter entre 1 e 1.000 caracteres." }, { status: 400 })
  }

  const parentId = String(body.parentId ?? "").trim()
  if (parentId && !await postCommentExists(id, parentId)) {
    return Response.json({ error: "O comentário respondido não existe neste post." }, { status: 400 })
  }

  const commentId = await createPostComment(id, session.user.id, comment, parentId || undefined)
  const recipientId = parentId ? await getCommentAuthorId(parentId) : await getPostAuthorId(id)
  await createNotification({ recipientId, actorId: session.user.id, type: parentId ? "reply" : "comment", postId: id, commentId })
  return Response.json({ ok: true }, { status: 201 })
}
