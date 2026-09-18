import { auth } from "@/lib/auth"
import { createPost, getPosts } from "@/lib/posts/queries"
import { parsePost } from "@/lib/posts/validation"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  return Response.json({ posts: await getPosts(session.user.id) })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para publicar." }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Não foi possível ler os dados do post." }, { status: 400 })
  }

  const parsed = parsePost(body)
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 })

  const id = await createPost(session.user.id, parsed)
  return Response.json({ id }, { status: 201 })
}
