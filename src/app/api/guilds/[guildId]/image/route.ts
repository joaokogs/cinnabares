import { get } from "@vercel/blob"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { guild } from "@/db/schema"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params
  const pathname = new URL(request.url).searchParams.get("path")
  const [currentGuild] = await db
    .select({ image: guild.image })
    .from(guild)
    .where(eq(guild.id, guildId))
    .limit(1)

  if (!pathname || !currentGuild?.image || currentGuild.image !== pathname) {
    return new Response("Imagem não encontrada.", { status: 404 })
  }

  const blob = await get(pathname, { access: "private" })
  if (!blob || !blob.stream) return new Response("Imagem não encontrada.", { status: 404 })

  return new Response(blob.stream, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": blob.blob.contentType,
    },
  })
}
