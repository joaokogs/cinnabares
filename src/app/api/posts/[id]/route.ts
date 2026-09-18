import { auth } from "@/lib/auth"
import { getPost, updatePost } from "@/lib/posts/queries"
import { parsePost } from "@/lib/posts/validation"

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para editar." }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Não foi possível ler os dados do post." }, { status: 400 })
  }

  const parsed = parsePost(body)
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 })

  const { id } = await params
  const updated = await updatePost(id, session.user.id, parsed)
  if (!updated) return Response.json({ error: "Você não tem permissão para editar este post." }, { status: 403 })

  return Response.json({ ok: true })
}
