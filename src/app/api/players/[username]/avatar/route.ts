import { get } from "@vercel/blob"

import { getUserByUsername } from "@/lib/users/queries"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const player = await getUserByUsername(username)

  if (!player?.image) return new Response("Avatar não encontrado.", { status: 404 })

  const blob = await get(player.image, { access: "private" })
  if (!blob || !blob.stream) return new Response("Avatar não encontrado.", { status: 404 })

  return new Response(blob.stream, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": blob.blob.contentType,
    },
  })
}
