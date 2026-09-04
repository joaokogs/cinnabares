import { getAdminSession } from "@/lib/tournaments/auth"
import { getBracketByTournamentId, getTournament } from "@/lib/tournaments/queries"
import { countApprovedRegistrations, updateRegistrationStatus } from "@/lib/tournaments/repository"

type RouteProps = { params: Promise<{ id: string; registrationId: string }> }

async function ensureApprovalSlotAvailable(tournamentId: string): Promise<Response | null> {
  const currentTournament = await getTournament(tournamentId)
  if (!currentTournament) return Response.json({ error: "Não encontramos esse torneio." }, { status: 404 })

  const approved = await countApprovedRegistrations(tournamentId)
  if (approved >= currentTournament.slots) return Response.json({ error: "Não há mais vagas disponíveis neste torneio." }, { status: 409 })

  return null
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const admin = await getAdminSession(request.headers)
  if (admin.response) return admin.response

  const { id, registrationId } = await params
  const existingBracket = await getBracketByTournamentId(id)
  if (existingBracket) return Response.json({ error: "Não é possível alterar inscrições depois que a chave foi iniciada." }, { status: 409 })

  const body = await request.json() as { status?: "approved" | "rejected"; rejectionReason?: string }
  if (!body.status || !["approved", "rejected"].includes(body.status)) return Response.json({ error: "Escolha se a inscrição será aprovada ou recusada." }, { status: 400 })

  if (body.status === "approved") {
    const slotError = await ensureApprovalSlotAvailable(id)
    if (slotError) return slotError
  }

  const updated = await updateRegistrationStatus(registrationId, id, {
    status: body.status,
    rejectionReason: body.status === "rejected" ? body.rejectionReason?.trim() || "Inscrição recusada." : null,
    reviewedBy: admin.session.user.id,
  })

  if (!updated || updated.tournamentId !== id) return Response.json({ error: "Não encontramos essa inscrição neste torneio." }, { status: 404 })
  return Response.json(updated)
}