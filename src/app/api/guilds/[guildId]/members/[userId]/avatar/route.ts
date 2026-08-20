import { get } from "@vercel/blob"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { guildMember, user } from "@/db/schema"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string; userId: string }> }
) {
  const { guildId, userId } = await params
  const [member] = await db
    .select({ image: user.image })
    .from(guildMember)
    .innerJoin(user, eq(user.id, guildMember.userId))
    .where(and(eq(guildMember.guildId, guildId), eq(guildMember.userId, userId)))
    .limit(1)

  if (!member?.image) return new Response("Avatar não encontrado.", { status: 404 })

  const blob = await get(member.image, { access: "private" })
  if (!blob || !blob.stream) return new Response("Avatar não encontrado.", { status: 404 })

  return new Response(blob.stream, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": blob.blob.contentType,
    },
  })
}
