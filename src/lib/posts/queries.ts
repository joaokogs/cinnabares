import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { db } from "@/db"
import { post, postBookmark, postComment, postLike, postPokemon, postRepost, user } from "@/db/schema"
import type { PostFeedItem, PostInput } from "./types"

const PAGE_SIZE = 20

function avatarUrl(username: string | null, image: string | null) {
  return image && username ? `/api/players/${encodeURIComponent(username)}/avatar` : null
}

function serializeDate(value: Date) {
  return value.toISOString()
}

export async function getPosts(viewerId: string, limit = PAGE_SIZE): Promise<PostFeedItem[]> {
  const rows = await db
    .select({
      id: post.id,
      title: post.title,
      description: post.description,
      createdAt: post.createdAt,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorImage: user.image,
      likes: sql<number>`cast((select count(*) from post_like where post_like.post_id = ${post.id}) as int)`,
      comments: sql<number>`cast((select count(*) from post_comment where post_comment.post_id = ${post.id}) as int)`,
      reposts: sql<number>`cast((select count(*) from post_repost where post_repost.post_id = ${post.id}) as int)`,
      bookmarks: sql<number>`cast((select count(*) from post_bookmark where post_bookmark.post_id = ${post.id}) as int)`,
      liked: sql<boolean>`exists(select 1 from post_like where post_like.post_id = ${post.id} and post_like.user_id = ${viewerId})`,
      reposted: sql<boolean>`exists(select 1 from post_repost where post_repost.post_id = ${post.id} and post_repost.user_id = ${viewerId})`,
      bookmarked: sql<boolean>`exists(select 1 from post_bookmark where post_bookmark.post_id = ${post.id} and post_bookmark.user_id = ${viewerId})`,
    })
    .from(post)
    .innerJoin(user, eq(user.id, post.authorId))
    .orderBy(desc(post.createdAt))
    .limit(limit)

  if (rows.length === 0) return []

  const postIds = rows.map((row) => row.id)
  const [pokemonRows, commentRows] = await Promise.all([
    db.select({
      id: postPokemon.id,
      postId: postPokemon.postId,
      slot: postPokemon.slot,
      name: postPokemon.name,
      item: postPokemon.item,
      ability: postPokemon.ability,
      nature: postPokemon.nature,
      ivs: postPokemon.ivs,
      evs: postPokemon.evs,
      moves: postPokemon.moves,
    }).from(postPokemon).where(inArray(postPokemon.postId, postIds)).orderBy(postPokemon.slot),
    db.select({
      id: postComment.id,
      postId: postComment.postId,
      body: postComment.body,
      createdAt: postComment.createdAt,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorImage: user.image,
    }).from(postComment)
      .innerJoin(user, eq(user.id, postComment.userId))
      .where(inArray(postComment.postId, postIds))
      .orderBy(desc(postComment.createdAt)),
  ])

  const pokemonByPost = new Map<string, typeof pokemonRows>()
  for (const pokemon of pokemonRows) {
    const items = pokemonByPost.get(pokemon.postId) ?? []
    items.push(pokemon)
    pokemonByPost.set(pokemon.postId, items)
  }

  const commentsByPost = new Map<string, typeof commentRows>()
  for (const comment of commentRows) {
    const items = commentsByPost.get(comment.postId) ?? []
    if (items.length < 3) items.push(comment)
    commentsByPost.set(comment.postId, items)
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: serializeDate(row.createdAt),
    author: {
      id: row.authorId,
      name: row.authorName,
      username: row.authorUsername,
      image: row.authorImage,
      avatarUrl: avatarUrl(row.authorUsername, row.authorImage),
    },
    pokemon: (pokemonByPost.get(row.id) ?? []).map((item) => ({
      id: item.id,
      slot: item.slot,
      name: item.name,
      item: item.item,
      ability: item.ability,
      nature: item.nature,
      ivs: item.ivs,
      evs: item.evs,
      moves: item.moves,
    })),
    comments: (commentsByPost.get(row.id) ?? []).map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: serializeDate(comment.createdAt),
      author: {
        id: comment.authorId,
        name: comment.authorName,
        username: comment.authorUsername,
        image: comment.authorImage,
        avatarUrl: avatarUrl(comment.authorUsername, comment.authorImage),
      },
    })),
    counts: {
      likes: Number(row.likes),
      comments: Number(row.comments),
      reposts: Number(row.reposts),
      bookmarks: Number(row.bookmarks),
    },
    viewer: {
      liked: Boolean(row.liked),
      reposted: Boolean(row.reposted),
      bookmarked: Boolean(row.bookmarked),
    },
  }))
}

export async function createPost(authorId: string, input: PostInput) {
  const id = randomUUID()
  await db.insert(post).values({
    id,
    authorId,
    title: input.title,
    description: input.description,
  })

  if (input.pokemon.length > 0) {
    await db.insert(postPokemon).values(input.pokemon.map((pokemon, index) => ({
      id: randomUUID(),
      postId: id,
      slot: index,
      name: pokemon.name,
      item: pokemon.item ?? "",
      ability: pokemon.ability ?? "",
      nature: pokemon.nature ?? "",
      ivs: pokemon.ivs ?? {},
      evs: pokemon.evs ?? {},
      moves: pokemon.moves ?? [],
    })))
  }

  return id
}

const actionTables = {
  like: postLike,
  repost: postRepost,
  bookmark: postBookmark,
} as const

export type PostAction = keyof typeof actionTables

export async function togglePostAction(postId: string, userId: string, action: PostAction) {
  const table = actionTables[action]
  const condition = and(eq(table.postId, postId), eq(table.userId, userId))
  const existing = await db.select({ postId: table.postId }).from(table).where(condition).limit(1)
  if (existing.length > 0) {
    await db.delete(table).where(condition)
    return false
  }

  await db.insert(table).values({ postId, userId })
  return true
}

export async function createPostComment(postId: string, userId: string, body: string) {
  await db.insert(postComment).values({ id: randomUUID(), postId, userId, body })
}

export async function postExists(postId: string) {
  const [row] = await db.select({ id: post.id }).from(post).where(eq(post.id, postId)).limit(1)
  return Boolean(row)
}
