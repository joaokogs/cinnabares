export type NotificationType = "post_like" | "comment" | "reply" | "comment_like"

export type NotificationItem = {
  id: string
  type: NotificationType
  postId: string | null
  commentId: string | null
  createdAt: string
  readAt: string | null
  actor: {
    id: string
    name: string
    username: string | null
    avatarUrl: string | null
  }
}
