import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { db } from "@/db"
import { guild, guildInvite } from "@/db/schema"
import { auth } from "@/lib/auth"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 })

  const { guildId } = await params
  const [currentGuild] = await db
    .select({ founderId: guild.founderId })
    .from(guild)
    .where(eq(guild.id, guildId))
    .limit(1)

  if (!currentGuild) return Response.json({ error: "Guilda não encontrada." }, { status: 404 })
  if (currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Apenas o fundador pode criar convites." }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    maxUses?: number | null
    expiresAt?: string | null
  }

  const token = randomUUID()
  const [invite] = await db
    .insert(guildInvite)
    .values({
      id: randomUUID(),
      guildId,
      createdBy: session.user.id,
      token,
      maxUses: body.maxUses ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    })
    .returning({ token: guildInvite.token })

  const url = `${SITE_URL}/guildas/${encodeURIComponent((await db.select({ tag: guild.tag }).from(guild).where(eq(guild.id, guildId)).limit(1))[0].tag)}/join?token=${invite.token}`

  return Response.json({ token: invite.token, url })
}
