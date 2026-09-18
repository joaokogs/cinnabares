import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { auth } from "@/lib/auth"
import { getPost } from "@/lib/posts/queries"
import { PostDetail } from "@/app/(app)/posts/_components/post-interactions"

type PostPageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const viewerId = session?.user.id ?? null
  const post = await getPost(viewerId, id)
  return { title: post ? `${post.title} · Post` : "Post" }
}

export default async function PostPage({ params }: PostPageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  const viewerId = session?.user.id ?? null

  const { id } = await params
  const post = await getPost(viewerId, id)
  if (!post) notFound()

  return <PostDetail initialPost={post} viewerId={viewerId} />
}