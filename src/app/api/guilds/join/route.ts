import { auth } from "@/lib/auth"
import {
  findDefaultMemberRole,
  findGuildTag,
  findInviteByToken,
  findMembershipByUser,
  joinGuildViaInvite,
  type GuildInviteRow,
} from "@/lib/guilds/repository"

async function inviteErrorResponse(invite: GuildInviteRow, userId: string) {
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return Response.json({ error: "Este convite expirou. Solicite um novo link ao fundador." }, { status: 410 })
  }
  if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
    return Response.json({ error: "Este convite já atingiu o limite de usos." }, { status: 410 })
  }
  const existingMembership = await findMembershipByUser(userId)
  if (existingMembership) {
    return Response.json({ error: "Você já pertence a uma guilda. Saia dela antes de entrar em outra." }, { status: 409 })
  }
  return null
}

function handleJoinError(error: unknown) {
  const databaseError = error as { cause?: { code?: string; constraint?: string } }
  if (databaseError.cause?.code === "23505") {
    if (databaseError.cause.constraint === "guild_member_user_unique") {
      return Response.json({ error: "Você já pertence a uma guilda. Saia dela antes de entrar em outra." }, { status: 409 })
    }
  }
  return Response.json({ error: "Não foi possível concluir sua entrada na guilda. Tente novamente em instantes." }, { status: 500 })
}

async function joinViaInvite(invite: GuildInviteRow, userId: string) {
  const memberRole = await findDefaultMemberRole(invite.guildId)
  if (!memberRole) {
    return Response.json({ error: "A guilda não está pronta para receber novos membros. Avise o fundador." }, { status: 500 })
  }
  try {
    const joined = await joinGuildViaInvite({ inviteId: invite.id, userId, roleId: memberRole.id })
    if (joined.rows.length === 0) {
      return Response.json({ error: "Este convite acabou de expirar ou atingir o limite de usos. Solicite outro link." }, { status: 410 })
    }
    return null
  } catch (error) {
    return handleJoinError(error)
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para entrar em uma guilda." }, { status: 401 })

  const body = (await request.json()) as { token?: string }
  if (!body.token) return Response.json({ error: "O link de convite está incompleto. Solicite um novo convite ao fundador." }, { status: 400 })

  const invite = await findInviteByToken(body.token)
  if (!invite) return Response.json({ error: "Este convite não existe ou já foi revogado." }, { status: 404 })

  const inviteError = await inviteErrorResponse(invite, session.user.id)
  if (inviteError) return inviteError

  const joinError = await joinViaInvite(invite, session.user.id)
  if (joinError) return joinError

  const guildData = await findGuildTag(invite.guildId)
  return Response.json({ tag: guildData?.tag })
}
