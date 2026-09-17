import { randomUUID } from "node:crypto"

import { auth } from "@/lib/auth"
import { createNotification } from "@/lib/notifications/queries"
import { findGuildFounder, findGuildTag, findMembershipByUser, insertGuildInvite } from "@/lib/guilds/repository"
import { getUserById } from "@/lib/users/queries"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const currentGuild = await findGuildFounder(guildId)

  if (!currentGuild) return Response.json({ error: "Não encontramos essa guilda." }, { status: 404 })
  if (currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Você não tem permissão para criar convites. Apenas o fundador pode fazer isso." }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    maxUses?: number | null
    expiresAt?: string | null
    userId?: string
  }

  const recipientId = typeof body.userId === "string" ? body.userId.trim() || null : null
  if (recipientId) {
    const [player, membership] = await Promise.all([getUserById(recipientId), findMembershipByUser(recipientId)])
    if (!player) return Response.json({ error: "Esse player não existe." }, { status: 404 })
    if (membership) return Response.json({ error: "Esse player já pertence a uma guilda." }, { status: 409 })
  }

  const token = randomUUID()
  const invite = await insertGuildInvite({
    id: randomUUID(),
    guildId,
    createdBy: session.user.id,
    token,
    maxUses: recipientId ? 1 : body.maxUses ?? null,
    expiresAt: recipientId ? new Date(Date.now() + 7 * 86400000) : body.expiresAt ? new Date(body.expiresAt) : null,
    recipientId,
  })

  const guildData = await findGuildTag(guildId)
  const url = `${SITE_URL}/guildas/${encodeURIComponent(guildData?.tag ?? "")}/join?token=${invite.token}`

  if (recipientId) {
    await createNotification({ recipientId, actorId: session.user.id, type: "guild_invite", link: url })
  }

  return Response.json({ token: invite.token, url, player: recipientId ? { name: (await getUserById(recipientId))?.name } : undefined })
}
