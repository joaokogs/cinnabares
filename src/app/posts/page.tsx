import type { Metadata } from "next"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { getPosts } from "@/lib/posts/queries"
import { PostsFeed } from "@/app/(app)/posts/_components/posts-feed"

export const metadata: Metadata = {
  title: "Posts",
  description: "Compartilhe estratégias, builds e descobertas Pokémon com a comunidade.",
}

export const dynamic = "force-dynamic"

export default async function PostsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const viewerId = session?.user.id ?? null

  const posts = await getPosts(viewerId)
  return <PostsFeed initialPosts={posts} userName={session?.user.name} viewerId={viewerId} />
}