import { and, asc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { guild, guildMember, user } from "@/db/schema"
const escapeLike = (value: string) => {
  const bs = String.fromCharCode(92)
  return value.split(bs).join(bs + bs).split("%").join(bs + "%").split("_").join(bs + "_")
}

const PAGE_SIZE = 24

export type PlayerStatus = "all" | "member" | "solo"

export type PlayerSearchResult = {
  id: string
  name: string
  username: string | null
  displayUsername: string | null
  image: string | null
  guildId: string | null
  guildImage: string | null
  guildName: string | null
  guildTag: string | null
}

export type PlayerSearchParams = {
  query?: string
  guildTag?: string | null
  status?: PlayerStatus
  page?: number | string
}

export type PlayerSearchResponse = {
  players: PlayerSearchResult[]
  total: number
  totalPages: number
  page: number
}

const publicUserFields = {
  id: user.id,
  name: user.name,
  username: user.username,
  image: user.image,
}

export async function searchPlayers({
  query = "",
  guildTag = null,
  status = "all",
  page = 1,
}: PlayerSearchParams): Promise<PlayerSearchResponse> {
  const trimmed = query.trim()

  const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof ilike> | ReturnType<typeof or> | ReturnType<typeof sql>> = []

  if (trimmed) {
    conditions.push(
      or(
        ilike(user.name, `%${escapeLike(trimmed)}%`),
        ilike(user.username, `%${escapeLike(trimmed)}%`),
        ilike(user.displayUsername, `%${escapeLike(trimmed)}%`)
      )!
    )
  }

  if (status === "member") {
    conditions.push(sql`${user.id} IN (SELECT user_id FROM guild_member)`)
  } else if (status === "solo") {
    conditions.push(sql`${user.id} NOT IN (SELECT user_id FROM guild_member)`)
  }

  if (guildTag) {
    conditions.push(eq(guild.tag, guildTag))
  }

  const where = conditions.length ? and(...conditions) : undefined

  const [totalRow] = await db
    .select({ value: sql<number>`cast(count(*) as int)` })
    .from(user)
    .leftJoin(guildMember, eq(guildMember.userId, user.id))
    .leftJoin(guild, eq(guild.id, guildMember.guildId))
    .where(where)

  const total = totalRow?.value ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, Math.floor(Number(page)) || 1), totalPages)
  const offset = (currentPage - 1) * PAGE_SIZE

  const players = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      displayUsername: user.displayUsername,
      image: user.image,
      guildId: guild.id,
      guildImage: guild.image,
      guildName: guild.name,
      guildTag: guild.tag,
    })
    .from(user)
    .leftJoin(guildMember, eq(guildMember.userId, user.id))
    .leftJoin(guild, eq(guild.id, guildMember.guildId))
    .where(where)
    .orderBy(asc(user.name))
    .limit(PAGE_SIZE)
    .offset(offset)

  return { players, total, totalPages, page: currentPage }
}

export async function getUserByUsername(username: string) {
  const [player] = await db
    .select(publicUserFields)
    .from(user)
    .where(eq(user.username, username.toLowerCase()))
    .limit(1)

  return player ?? null
}

export async function getUserById(id: string) {
  const [player] = await db
    .select(publicUserFields)
    .from(user)
    .where(eq(user.id, id))
    .limit(1)

  return player ?? null
}
