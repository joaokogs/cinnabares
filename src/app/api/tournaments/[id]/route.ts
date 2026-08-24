import { eq } from "drizzle-orm"

import { db } from "@/db"
import { tournament } from "@/db/schema"
import { getAdminSession } from "@/lib/tournaments/auth"
import { getTournament } from "@/lib/tournaments/queries"

type RouteProps = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params
  const result = await getTournament(id)
  if (!result) return Response.json({ error: "Não encontramos esse torneio. Ele pode ter sido removido." }, { status: 404 })
  return Response.json(result)
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id } = await params
  const body = await request.json() as { status?: "draft" | "open" | "closed" | "active" | "finished" }
  if (!body.status || !["draft", "open", "closed", "active", "finished"].includes(body.status)) {
    return Response.json({ error: "Escolha um status válido para o torneio." }, { status: 400 })
  }

  const currentTournament = await getTournament(id)
  if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio para atualizar." }, { status: 404 })

  const allowedTransitions: Record<typeof currentTournament.status, readonly string[]> = {
    draft: ["open"],
    open: ["closed"],
    closed: [],
    active: [],
    finished: [],
  }
  if (body.status !== currentTournament.status && !allowedTransitions[currentTournament.status].includes(body.status)) {
    return Response.json({ error: "Essa transição de status não é permitida." }, { status: 409 })
  }

  const [updated] = await db.update(tournament).set({ status: body.status, updatedAt: new Date() }).where(eq(tournament.id, id)).returning({ id: tournament.id })
  if (!updated) return Response.json({ error: "Não encontramos esse torneio para atualizar." }, { status: 404 })
  return Response.json(updated)
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id } = await params
  const [deleted] = await db.delete(tournament).where(eq(tournament.id, id)).returning({ id: tournament.id })
  if (!deleted) return Response.json({ error: "Não encontramos esse torneio para remover." }, { status: 404 })
  return new Response(null, { status: 204 })
}
