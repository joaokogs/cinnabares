import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getNotifications } from "@/lib/notifications/queries"
import { NotificationsList } from "./_components/notifications-list"

export const metadata: Metadata = { title: "Notificações" }
export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const notifications = await getNotifications(session.user.id)
  return <main className="relative min-h-screen overflow-x-hidden bg-background"><section className="relative mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 lg:py-10"><div className="mb-7 border-b border-border/60 pb-6"><p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">Atividade</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Notificações</h1><p className="mt-2 text-sm text-muted-foreground">Acompanhe curtidas, comentários e respostas nos seus posts.</p></div><NotificationsList initialNotifications={notifications} /></section></main>
}
