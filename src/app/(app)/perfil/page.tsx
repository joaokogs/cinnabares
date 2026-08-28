import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { PlayerProfile } from "@/components/shared/player-profile"
import { getUserGuild } from "@/lib/guilds/queries"
import { auth } from "@/lib/auth"
import { getUserById } from "@/lib/users/queries"
import { SignOutButton } from "./_components/sign-out-button"

export const metadata: Metadata = {
  title: "Meu perfil",
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/login")

  const [player, guild] = await Promise.all([
    getUserById(session.user.id),
    getUserGuild(session.user.id),
  ])

  if (!player) redirect("/login")

  return (
    <PlayerProfile
      player={player}
      guild={guild}
      avatarUrl={player.image ? `/api/profile/avatar?path=${encodeURIComponent(player.image)}` : null}
      isSelf
      headerAction={<SignOutButton />}
    />
  )
}
