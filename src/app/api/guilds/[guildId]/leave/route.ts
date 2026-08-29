import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { guild, guildMember } from "@/db/schema"
import { auth } from "@/lib/auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const [currentGuild] = await db
    .select({ founderId: guild.founderId })
    .from(guild)
    .where(eq(guild.id, guildId))
    .limit(1)

  if (!currentGuild) return Response.json({ error: "Esta guilda não existe mais." }, { status: 404 })

  if (currentGuild.founderId === session.user.id) {
    return Response.json({ error: "O fundador não pode sair da guilda. Exclua a guilda se desejar." }, { status: 403 })
  }

  const [membership] = await db
    .select({ guildId: guildMember.guildId })
    .from(guildMember)
    .where(and(eq(guildMember.guildId, guildId), eq(guildMember.userId, session.user.id)))
    .limit(1)

  if (!membership) return Response.json({ error: "Você não é membro desta guilda." }, { status: 404 })

  await db
    .delete(guildMember)
    .where(and(eq(guildMember.guildId, guildId), eq(guildMember.userId, session.user.id)))

  return Response.json({ ok: true })
}
