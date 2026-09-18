import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getPost } from "@/lib/posts/queries"
import { AppShell } from "@/app/(app)/_components/app-shell"
import { EditPostPage } from "@/app/(app)/posts/_components/post-interactions"

type EditPostRouteProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Editar post",
}

export default async function EditPostRoute({ params }: EditPostRouteProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  const { id } = await params
  if (!session) redirect(`/login?redirect=${encodeURIComponent(`/posts/${id}/editar`)}`)

  const post = await getPost(session.user.id, id)
  if (!post) notFound()
  if (!post.viewer.isAuthor) redirect(`/posts/${id}`)

  return <AppShell user={{ id: session.user.id, name: session.user.name, username: session.user.username ?? null, image: session.user.image ?? null }}><EditPostPage initialPost={post} /></AppShell>
}
