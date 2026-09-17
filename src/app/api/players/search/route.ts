import { auth } from "@/lib/auth"
import { searchPlayers } from "@/lib/users/queries"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou." }, { status: 401 })

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (query.length < 2) return Response.json({ players: [] })

  const result = await searchPlayers({ query, page: 1 })
  return Response.json({ players: result.players.slice(0, 8).map((player) => ({
    id: player.id,
    name: player.name,
    username: player.username,
    image: player.image,
    avatarUrl: player.image ? player.username ? `/api/players/${encodeURIComponent(player.username)}/avatar` : `/api/profile/avatar?path=${encodeURIComponent(player.image)}` : null,
  })) })
}
