import { and, desc, eq, isNull, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { db } from "@/db"
import { notification, user } from "@/db/schema"
import type { NotificationItem, NotificationType } from "./types"

function avatarUrl(username: string | null, image: string | null) {
  return image && username ? `/api/players/${encodeURIComponent(username)}/avatar` : null
}

export async function createNotification(input: {
  recipientId: string | null
  actorId: string
  type: NotificationType
  postId?: string
  commentId?: string
}) {
  if (!input.recipientId || input.recipientId === input.actorId) return
  await db.insert(notification).values({
    id: randomUUID(),
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: input.type,
    postId: input.postId ?? null,
    commentId: input.commentId ?? null,
  })
}

export async function removeNotification(input: {
  recipientId: string | null
  actorId: string
  type: NotificationType
  postId?: string
  commentId?: string
}) {
  if (!input.recipientId || input.recipientId === input.actorId) return
  await db.delete(notification).where(and(
    eq(notification.recipientId, input.recipientId),
    eq(notification.actorId, input.actorId),
    eq(notification.type, input.type),
    input.postId ? eq(notification.postId, input.postId) : isNull(notification.postId),
    input.commentId ? eq(notification.commentId, input.commentId) : isNull(notification.commentId),
  ))
}

export async function getNotifications(userId: string, limit = 50): Promise<NotificationItem[]> {
  const rows = await db.select({
    id: notification.id,
    type: notification.type,
    postId: notification.postId,
    commentId: notification.commentId,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
    actorId: user.id,
    actorName: user.name,
    actorUsername: user.username,
    actorImage: user.image,
  }).from(notification)
    .innerJoin(user, eq(user.id, notification.actorId))
    .where(eq(notification.recipientId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    postId: row.postId,
    commentId: row.commentId,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    actor: {
      id: row.actorId,
      name: row.actorName,
      username: row.actorUsername,
      avatarUrl: avatarUrl(row.actorUsername, row.actorImage),
    },
  }))
}

export async function getUnreadNotificationCount(userId: string) {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(notification).where(and(eq(notification.recipientId, userId), isNull(notification.readAt)))
  return Number(row?.count ?? 0)
}

export async function markNotificationsRead(userId: string) {
  await db.update(notification).set({ readAt: new Date() }).where(and(eq(notification.recipientId, userId), isNull(notification.readAt)))
}
