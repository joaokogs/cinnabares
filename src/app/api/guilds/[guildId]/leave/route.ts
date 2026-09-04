import { auth } from "@/lib/auth"
import { deleteMembership, findGuildFounder, findMembership } from "@/lib/guilds/repository"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const currentGuild = await findGuildFounder(guildId)

  if (!currentGuild) return Response.json({ error: "Esta guilda não existe mais." }, { status: 404 })

  if (currentGuild.founderId === session.user.id) {
    return Response.json({ error: "O fundador não pode sair da guilda. Exclua a guilda se desejar." }, { status: 403 })
  }

  const membership = await findMembership(guildId, session.user.id)

  if (!membership) return Response.json({ error: "Você não é membro desta guilda." }, { status: 404 })

  await deleteMembership(guildId, session.user.id)

  return Response.json({ ok: true })
}
