import { asc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { guild, guildMember, guildRole, user } from "@/db/schema"

export async function getGuildByTag(tag: string) {
  const [result] = await db.select().from(guild).where(eq(guild.tag, tag)).limit(1)
  return result ?? null
}

export async function searchGuilds(query: string) {
  const trimmed = query.trim()
  if (!trimmed) {
    return db
      .select({ id: guild.id, name: guild.name, tag: guild.tag, description: guild.description, image: guild.image })
      .from(guild)
  }

  return db
    .select({ id: guild.id, name: guild.name, tag: guild.tag, description: guild.description, image: guild.image })
    .from(guild)
    .where(
      or(
        ilike(guild.name, sql`%${trimmed}%`),
        ilike(guild.tag, sql`%${trimmed}%`)
      )
    )
}

export async function getUserGuild(userId: string) {
  const [row] = await db
    .select({
      guildId: guildMember.guildId,
      guildName: guild.name,
      guildTag: guild.tag,
      guildDescription: guild.description,
      guildImage: guild.image,
      guildBanner: guild.banner,
      guildFounderId: guild.founderId,
    })
    .from(guildMember)
    .innerJoin(guild, eq(guildMember.guildId, guild.id))
    .where(eq(guildMember.userId, userId))
    .limit(1)

  return row ?? null
}

export async function getGuildMemberCount(guildId: string) {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(guildMember)
    .where(eq(guildMember.guildId, guildId))

  return result?.count ?? 0
}

export async function getGuildMembers(guildId: string) {
  return db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      joinedAt: guildMember.joinedAt,
    })
    .from(guildMember)
    .innerJoin(user, eq(user.id, guildMember.userId))
    .where(eq(guildMember.guildId, guildId))
    .orderBy(asc(guildMember.joinedAt))
}

export async function getGuildRoles(guildId: string) {
  return db
    .select({
      id: guildRole.id,
      name: guildRole.name,
      color: guildRole.color,
      position: guildRole.position,
      isDefault: guildRole.isDefault,
      permissions: guildRole.permissions,
    })
    .from(guildRole)
    .where(eq(guildRole.guildId, guildId))
    .orderBy(asc(guildRole.position), asc(guildRole.createdAt))
}
