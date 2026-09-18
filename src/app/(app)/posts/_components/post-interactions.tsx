"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { getMentionOptions } from "@/components/ui/mention-textarea"
import { usePokeApiData } from "@/hooks/use-pokeapi-data"
import type { PostFeedItem } from "@/lib/posts/types"
import { CreatePost, LinkedPostCard, PostCard } from "./posts-feed"

function usePostOptions() {
  const { pokemon, items, abilities, natures, moves, loading: optionsLoading, error: optionsError } = usePokeApiData()
  const options = useMemo(() => ({ pokemon, items, abilities, natures, moves }), [abilities, items, moves, natures, pokemon])
  const mentionOptions = useMemo(() => getMentionOptions(options), [options])
  return { pokemon, options, mentionOptions, optionsLoading, optionsError }
}

export function CreatePostPage() {
  const router = useRouter()
  const { options, mentionOptions, optionsLoading, optionsError } = usePostOptions()
  async function handleCreated() {
    router.push("/posts")
    router.refresh()
  }

  return <main className="relative min-h-screen overflow-x-hidden bg-background"><section className="relative mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 lg:py-10"><Link href="/posts" className="mb-5 inline-flex items-center text-sm font-semibold text-accent hover:underline">← Voltar para posts</Link><h1 className="mb-2 font-heading text-3xl font-bold tracking-tight">Criar post</h1><p className="mb-7 text-sm text-muted-foreground">Compartilhe uma estratégia, build ou descoberta com a comunidade.</p>{optionsError ? <p className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">As sugestões da PokéAPI não carregaram. Ainda é possível preencher os nomes manualmente.</p> : null}{optionsLoading ? <p className="mb-4 text-xs text-muted-foreground">Carregando sugestões de Pokémon e itens...</p> : null}<CreatePost options={options} mentionOptions={mentionOptions} onCreated={handleCreated} /></section></main>
}

export function PostDetail({ initialPost }: { initialPost: PostFeedItem }) {
  const [post, setPost] = useState(initialPost)
  const { pokemon, mentionOptions } = usePostOptions()

  async function refreshPost() {
    const response = await fetch(`/api/posts/${post.id}`, { cache: "no-store" })
    if (response.ok) {
      const result = await response.json() as { post: PostFeedItem }
      setPost(result.post)
    }
  }

  async function action(postId: string, actionName: "like" | "repost" | "bookmark") {
    const response = await fetch(`/api/posts/${postId}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName }) })
    if (!response.ok) return
    const result = await response.json() as { active: boolean }
    const countName = actionName === "like" ? "likes" : actionName === "repost" ? "reposts" : "bookmarks"
    const viewerName = actionName === "like" ? "liked" : actionName === "repost" ? "reposted" : "bookmarked"
    setPost((current) => ({ ...current, counts: { ...current.counts, [countName]: Math.max(0, current.counts[countName] + (result.active ? 1 : -1)) }, viewer: { ...current.viewer, [viewerName]: result.active } }))
  }

  async function comment(postId: string, body: string, parentId?: string) {
    const response = await fetch(`/api/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, parentId }) })
    if (response.ok) await refreshPost()
  }

  return <main className="relative min-h-screen overflow-x-hidden bg-background"><section className="relative mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 lg:py-10"><Link href="/posts" className="mb-5 inline-flex items-center text-sm font-semibold text-accent hover:underline">← Voltar para posts</Link><PostCard post={post} options={pokemon} mentionOptions={mentionOptions} onAction={(postId, actionName) => void action(postId, actionName)} onComment={comment} /></section></main>
}

export function ProfilePosts({ initialPosts, viewerId }: { initialPosts: PostFeedItem[]; viewerId: string }) {
  const [posts, setPosts] = useState(initialPosts)
  const { pokemon, mentionOptions } = usePostOptions()

  async function action(postId: string, actionName: "like" | "repost" | "bookmark") {
    const response = await fetch(`/api/posts/${postId}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName }) })
    if (!response.ok) return
    const result = await response.json() as { active: boolean }
    const countName = actionName === "like" ? "likes" : actionName === "repost" ? "reposts" : "bookmarks"
    const viewerName = actionName === "like" ? "liked" : actionName === "repost" ? "reposted" : "bookmarked"
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, counts: { ...post.counts, [countName]: Math.max(0, post.counts[countName] + (result.active ? 1 : -1)) }, viewer: { ...post.viewer, [viewerName]: result.active } } : post))
  }

  async function comment(postId: string, body: string, parentId?: string) {
    const response = await fetch(`/api/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, parentId }) })
    if (!response.ok) return
    const refreshed = await fetch(`/api/posts/${postId}`, { cache: "no-store" })
    if (refreshed.ok) {
      const result = await refreshed.json() as { post: PostFeedItem }
      setPosts((current) => current.map((post) => post.id === postId ? result.post : post))
    }
  }

  if (posts.length === 0) return <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">Este usuário ainda não publicou posts.</div>
  return <div className="space-y-5">{posts.map((post) => <LinkedPostCard key={post.id} post={post} options={pokemon} mentionOptions={mentionOptions} canPin={post.author.id === viewerId} onAction={(postId, actionName) => void action(postId, actionName)} onComment={comment} />)}</div>
}
