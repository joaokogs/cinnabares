import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { user as userTable } from "@/db/schema"
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
  let isFounder = false
  if (guildRow) {
    memberCount = await getGuildMemberCount(guildRow.guildId)
    isFounder = guildRow.guildFounderId === session.user.id
  }

  const user = session.user
  const [account] = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, user.id)).limit(1)

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        user={{
          name: user.name,
          username: user.username ?? null,
          image: user.image ?? null,
          role: account?.role ?? "user",
        }}
        guild={guildRow ? {
          name: guildRow.guildName,
          tag: guildRow.guildTag,
          memberCount,
          isFounder,
        } : null}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  )
}
