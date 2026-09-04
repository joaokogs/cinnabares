import { randomUUID } from "node:crypto"

import { auth } from "@/lib/auth"
import { findGuildFounder, findGuildTag, insertGuildInvite } from "@/lib/guilds/repository"

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
  }

  const token = randomUUID()
  const invite = await insertGuildInvite({
    id: randomUUID(),
    guildId,
    createdBy: session.user.id,
    token,
    maxUses: body.maxUses ?? null,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  })

  const guildData = await findGuildTag(guildId)
  const url = `${SITE_URL}/guildas/${encodeURIComponent(guildData?.tag ?? "")}/join?token=${invite.token}`

  return Response.json({ token: invite.token, url })
}
