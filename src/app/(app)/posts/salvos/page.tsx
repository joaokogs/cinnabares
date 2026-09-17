import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getSavedPosts } from "@/lib/posts/queries"
import { ProfilePosts } from "../_components/post-interactions"

export const metadata: Metadata = {
  title: "Posts salvos",
}

export const dynamic = "force-dynamic"

export default async function SavedPostsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const posts = await getSavedPosts(session.user.id)
  return <main className="relative min-h-screen overflow-x-hidden bg-background"><section className="relative mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 lg:py-10"><h1 className="font-heading text-3xl font-bold tracking-tight">Posts salvos</h1><p className="mt-2 mb-7 text-sm text-muted-foreground">Estratégias que você marcou para consultar depois.</p><ProfilePosts initialPosts={posts} /></section></main>
}
