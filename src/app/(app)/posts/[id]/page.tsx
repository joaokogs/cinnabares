import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getPost } from "@/lib/posts/queries"
import { PostDetail } from "../_components/post-interactions"

type PostPageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { title: "Post" }
  const post = await getPost(session.user.id, id)
  return { title: post ? `${post.title} · Post` : "Post" }
}

export default async function PostPage({ params }: PostPageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const { id } = await params
  const post = await getPost(session.user.id, id)
  if (!post) notFound()

  return <PostDetail initialPost={post} />
}
