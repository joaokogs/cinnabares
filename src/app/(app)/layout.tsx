import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserGuild, getGuildMemberCount } from "@/lib/guilds/queries"
import { AppSidebar } from "./_components/app-sidebar"

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  const guildRow = await getUserGuild(session.user.id)

  let memberCount = 0
  if (guildRow) {
    memberCount = await getGuildMemberCount(guildRow.guildId)
  }

  const user = session.user

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        user={{
          name: user.name,
          username: user.username ?? null,
          image: user.image ?? null,
        }}
         guild={guildRow ? {
           id: guildRow.guildId,
           name: guildRow.guildName,
           tag: guildRow.guildTag,
           memberCount,
           image: guildRow.guildImage,
         } : null}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  )
}
