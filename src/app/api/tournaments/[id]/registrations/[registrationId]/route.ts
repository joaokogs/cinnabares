import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { tournamentRegistration } from "@/db/schema"
import { getAdminSession } from "@/lib/tournaments/auth"
import { getBracketByTournamentId, getTournament } from "@/lib/tournaments/queries"

type RouteProps = { params: Promise<{ id: string; registrationId: string }> }

export async function PATCH(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id, registrationId } = await params
  const existingBracket = await getBracketByTournamentId(id)
  if (existingBracket) return Response.json({ error: "Não é possível alterar inscrições depois que a chave foi iniciada." }, { status: 409 })
  const body = await request.json() as { status?: "approved" | "rejected"; rejectionReason?: string }
  if (!body.status || !["approved", "rejected"].includes(body.status)) return Response.json({ error: "Escolha se a inscrição será aprovada ou recusada." }, { status: 400 })

  if (body.status === "approved") {
    const currentTournament = await getTournament(id)
    if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })
    const [approved] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(tournamentRegistration).where(and(eq(tournamentRegistration.tournamentId, id), eq(tournamentRegistration.status, "approved")))
    if ((approved?.count ?? 0) >= currentTournament.slots) return Response.json({ error: "Não há mais vagas disponíveis neste torneio." }, { status: 409 })
  }

  const [updated] = await db
    .update(tournamentRegistration)
    .set({ status: body.status, rejectionReason: body.status === "rejected" ? body.rejectionReason?.trim() || "Inscrição recusada." : null, reviewedBy: admin.session.user.id, reviewedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tournamentRegistration.id, registrationId), eq(tournamentRegistration.tournamentId, id)))
    .returning({ id: tournamentRegistration.id, tournamentId: tournamentRegistration.tournamentId })

  if (!updated || updated.tournamentId !== id) return Response.json({ error: "Não encontramos essa inscrição neste torneio." }, { status: 404 })
  return Response.json(updated)
}
