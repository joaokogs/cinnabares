import { getGuildMemberCount, getUserGuild } from "@/lib/guilds/queries"
import { getUnreadNotificationCount } from "@/lib/notifications/queries"
import { LoginGateProvider } from "@/components/shared/login-gate"
import { AppSidebar } from "./app-sidebar"

export type AppShellUser = {
  id: string
  name: string
  username: string | null
  image: string | null
}

export async function AppShell({ user, children }: { user: AppShellUser | null; children: React.ReactNode }) {
  const [guildRow, unreadNotificationCount] = user
    ? await Promise.all([getUserGuild(user.id), getUnreadNotificationCount(user.id)])
    : [null, 0] as const

  const memberCount = guildRow ? await getGuildMemberCount(guildRow.guildId) : 0

  return (
    <LoginGateProvider viewerId={user?.id ?? null}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar
          user={user ? { name: user.name, username: user.username, image: user.image } : null}
          guild={guildRow ? {
            id: guildRow.guildId,
            name: guildRow.guildName,
            tag: guildRow.guildTag,
            memberCount,
            image: guildRow.guildImage,
          } : null}
          notificationCount={unreadNotificationCount}
        />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </LoginGateProvider>
  )
}
