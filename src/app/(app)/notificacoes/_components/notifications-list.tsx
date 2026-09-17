"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, MessageCircle, Reply } from "lucide-react"
import { useEffect } from "react"

import type { NotificationItem } from "@/lib/notifications/types"

function relativeDate(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return "agora"
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function notificationText(item: NotificationItem) {
  if (item.type === "post_like") return "curtiu seu post."
  if (item.type === "comment") return "comentou no seu post."
  if (item.type === "reply") return "respondeu ao seu comentário."
  return "curtiu seu comentário."
}

function notificationIcon(type: NotificationItem["type"]) {
  if (type === "post_like" || type === "comment_like") return Heart
  if (type === "reply") return Reply
  return MessageCircle
}

export function NotificationsList({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  useEffect(() => {
    void fetch("/api/notifications/read", { method: "POST" })
  }, [])

  if (initialNotifications.length === 0) {
    return <div className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">Você ainda não tem notificações.</div>
  }

  return <div className="space-y-2">{initialNotifications.map((item) => {
    const Icon = notificationIcon(item.type)
    const href = item.postId ? `/posts/${item.postId}${item.commentId ? `#comment-${item.commentId}` : ""}` : "/notificacoes"
    return <Link key={item.id} href={href} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/90 p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"><div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/15 text-accent">{item.actor.avatarUrl ? <Image src={item.actor.avatarUrl} alt="" width={40} height={40} unoptimized className="size-full object-cover" /> : <span className="font-heading font-bold">{item.actor.name.slice(0, 1).toUpperCase()}</span>}</div><div className="min-w-0 flex-1 text-sm"><p><span className="font-semibold">{item.actor.name}</span> <span className="text-muted-foreground">{notificationText(item)}</span></p><p className="mt-1 text-xs text-muted-foreground">{relativeDate(item.createdAt)}</p></div><Icon className="size-5 shrink-0 text-accent" aria-hidden="true" /></Link>
  })}</div>
}
