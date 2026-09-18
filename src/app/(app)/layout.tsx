import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AppShell } from "./_components/app-shell"

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  const user = session.user

  return <AppShell user={{ id: user.id, name: user.name, username: user.username ?? null, image: user.image ?? null }}>{children}</AppShell>
}
