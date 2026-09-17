import { auth } from "@/lib/auth"
import { getPost } from "@/lib/posts/queries"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { id } = await params
  const post = await getPost(session.user.id, id)
  if (!post) return Response.json({ error: "Esse post não existe mais." }, { status: 404 })

  return Response.json({ post })
}
