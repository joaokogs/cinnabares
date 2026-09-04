import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { getUserGuild } from "@/lib/guilds/queries"
import { auth } from "@/lib/auth"
import { getUserByUsername } from "@/lib/users/queries"
import { PlayerProfile } from "@/components/shared/player-profile"

type PlayerPageProps = {
  params: Promise<{ username: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { username } = await params
  const player = await getUserByUsername(username)
  return { title: player ? `${player.name} · Perfil` : "Player" }
}

export default async function PublicPlayerPage({ params }: PlayerPageProps) {
  const { username } = await params
  const player = await getUserByUsername(username)

  if (!player) notFound()

  const [guild, session] = await Promise.all([
    getUserGuild(player.id),
    auth.api.getSession({ headers: await headers() }),
  ])

  return (
    <PlayerProfile
      player={player}
      guild={guild}
      avatarUrl={player.image ? `/api/players/${encodeURIComponent(player.username ?? username)}/avatar` : null}
      isSelf={session?.user.id === player.id}
    />
  )
}
