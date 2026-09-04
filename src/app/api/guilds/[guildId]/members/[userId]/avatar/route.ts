import { get } from "@vercel/blob"

import { findMemberAvatar } from "@/lib/guilds/repository"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string; userId: string }> }
) {
  const { guildId, userId } = await params
  const member = await findMemberAvatar(guildId, userId)

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
