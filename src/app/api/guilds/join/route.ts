import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { guild, guildInvite, guildMember, guildRole } from "@/db/schema"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para entrar em uma guilda." }, { status: 401 })

  const body = (await request.json()) as { token?: string }
  if (!body.token) return Response.json({ error: "O link de convite está incompleto. Solicite um novo convite ao fundador." }, { status: 400 })

  const [invite] = await db
    .select()
    .from(guildInvite)
    .where(eq(guildInvite.token, body.token))
    .limit(1)

  if (!invite) return Response.json({ error: "Este convite não existe ou já foi revogado." }, { status: 404 })

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return Response.json({ error: "Este convite expirou. Solicite um novo link ao fundador." }, { status: 410 })
  }

  if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
    return Response.json({ error: "Este convite já atingiu o limite de usos." }, { status: 410 })
  }

  const [existingMembership] = await db
    .select({ guildId: guildMember.guildId })
    .from(guildMember)
    .where(eq(guildMember.userId, session.user.id))
    .limit(1)

  if (existingMembership) {
    return Response.json({ error: "Você já pertence a uma guilda. Saia dela antes de entrar em outra." }, { status: 409 })
  }

  const [memberRole] = await db
    .select({ id: guildRole.id })
    .from(guildRole)
    .where(and(eq(guildRole.guildId, invite.guildId), eq(guildRole.isDefault, true), eq(guildRole.name, "Member")))
    .limit(1)

  if (!memberRole) {
    return Response.json({ error: "A guilda não está pronta para receber novos membros. Avise o fundador." }, { status: 500 })
  }

  try {
    const joined = await db.execute(sql`
      WITH claimed_invite AS (
        UPDATE guild_invite
        SET uses = uses + 1
        WHERE id = ${invite.id}
          AND (max_uses IS NULL OR uses < max_uses)
          AND (expires_at IS NULL OR expires_at > now())
        RETURNING guild_id
      ), inserted_member AS (
        INSERT INTO guild_member (guild_id, user_id)
        SELECT guild_id, ${session.user.id}
        FROM claimed_invite
        RETURNING guild_id, user_id
      )
      INSERT INTO guild_member_role (guild_id, user_id, role_id)
      SELECT guild_id, user_id, ${memberRole.id}
      FROM inserted_member
      RETURNING guild_id
    `)

    if (joined.rows.length === 0) {
      return Response.json({ error: "Este convite acabou de expirar ou atingir o limite de usos. Solicite outro link." }, { status: 410 })
    }
  } catch (error) {
    const databaseError = error as { cause?: { code?: string; constraint?: string } }
    if (databaseError.cause?.code === "23505") {
      if (databaseError.cause.constraint === "guild_member_user_unique") {
        return Response.json({ error: "Você já pertence a uma guilda. Saia dela antes de entrar em outra." }, { status: 409 })
      }
    }
    return Response.json({ error: "Não foi possível concluir sua entrada na guilda. Tente novamente em instantes." }, { status: 500 })
  }

  const [guildData] = await db
    .select({ tag: guild.tag })
    .from(guild)
    .where(eq(guild.id, invite.guildId))
    .limit(1)

  return Response.json({ tag: guildData?.tag })
}
