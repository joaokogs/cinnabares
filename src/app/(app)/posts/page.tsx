import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getPosts } from "@/lib/posts/queries"
import { PostsFeed } from "./_components/posts-feed"

export const metadata: Metadata = {
  title: "Posts",
  description: "Compartilhe estratégias, builds e descobertas Pokémon com a comunidade.",
}

export const dynamic = "force-dynamic"

export default async function PostsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const posts = await getPosts(session.user.id)
  return <PostsFeed initialPosts={posts} userName={session.user.name} />
}
