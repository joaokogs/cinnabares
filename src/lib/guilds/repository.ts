import { and, eq, ne, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { guild, guildInvite, guildMember, guildMemberRole, guildRole, user } from "@/db/schema"

export type GuildInviteRow = typeof guildInvite.$inferSelect

export type CreateGuildInput = {
  id: string
  name: string
  tag: string
  description: string
  image: string | null
  banner: string | null
  founderId: string
  founderRoleId: string
  memberRoleId: string
}

export async function findGuildByNameOrTag(name: string, tag: string) {
  const [row] = await db
    .select({ name: guild.name, tag: guild.tag })
    .from(guild)
    .where(or(eq(guild.name, name), eq(guild.tag, tag)))
    .limit(1)
  return row
}

export async function findMembershipByUser(userId: string) {
  const [row] = await db
    .select({ guildId: guildMember.guildId })
    .from(guildMember)
    .where(eq(guildMember.userId, userId))
    .limit(1)
  return row
}

export async function createGuild(input: CreateGuildInput) {
  const { id, name, tag, description, image, banner, founderId, founderRoleId, memberRoleId } = input
  await db.batch([
    db.insert(guild).values({ id, name, tag, description, image, banner, founderId }),
    db.insert(guildMember).values({ guildId: id, userId: founderId }),
    db.insert(guildRole).values({
      id: founderRoleId,
      guildId: id,
      name: "Founder",
      position: 0,
      isDefault: false,
      createdBy: founderId,
    }),
    db.insert(guildMemberRole).values({ guildId: id, userId: founderId, roleId: founderRoleId }),
    db.insert(guildRole).values({
      id: memberRoleId,
      guildId: id,
      name: "Member",
      position: 1,
      isDefault: true,
      permissions: {},
      createdBy: founderId,
    }),
  ])
}

export async function findInviteByToken(token: string) {
  const [row] = await db.select().from(guildInvite).where(eq(guildInvite.token, token)).limit(1)
  return row
}

export async function findDefaultMemberRole(guildId: string) {
  const [row] = await db
    .select({ id: guildRole.id })
    .from(guildRole)
    .where(and(eq(guildRole.guildId, guildId), eq(guildRole.isDefault, true), eq(guildRole.name, "Member")))
    .limit(1)
  return row
}

export async function joinGuildViaInvite(input: { inviteId: string; userId: string; roleId: string }) {
  const { inviteId, userId, roleId } = input
  return db.execute(sql`
    WITH claimed_invite AS (
      UPDATE guild_invite
      SET uses = uses + 1
      WHERE id = ${inviteId}
        AND (max_uses IS NULL OR uses < max_uses)
        AND (expires_at IS NULL OR expires_at > now())
      RETURNING guild_id
    ), inserted_member AS (
      INSERT INTO guild_member (guild_id, user_id)
      SELECT guild_id, ${userId}
      FROM claimed_invite
      RETURNING guild_id, user_id
    )
    INSERT INTO guild_member_role (guild_id, user_id, role_id)
    SELECT guild_id, user_id, ${roleId}
    FROM inserted_member
    RETURNING guild_id
  `)
}

export async function findGuildTag(guildId: string) {
  const [row] = await db.select({ tag: guild.tag }).from(guild).where(eq(guild.id, guildId)).limit(1)
  return row
}

export async function findGuildFounder(guildId: string) {
  const [row] = await db.select({ founderId: guild.founderId }).from(guild).where(eq(guild.id, guildId)).limit(1)
  return row
}

export async function findConflictingGuild(guildId: string, name: string, tag: string) {
  const [row] = await db
    .select({ id: guild.id, name: guild.name, tag: guild.tag })
    .from(guild)
    .where(and(or(eq(guild.name, name), eq(guild.tag, tag)), ne(guild.id, guildId)))
    .limit(1)
  return row
}

export async function updateGuild(guildId: string, data: { name: string; tag: string; description: string }) {
  await db.update(guild).set({ ...data, updatedAt: new Date() }).where(eq(guild.id, guildId))
}

export async function deleteGuild(guildId: string) {
  await db.delete(guild).where(eq(guild.id, guildId))
}

export async function findGuildBanner(guildId: string) {
  const [row] = await db.select({ founderId: guild.founderId, banner: guild.banner }).from(guild).where(eq(guild.id, guildId)).limit(1)
  return row
}

export async function updateGuildBanner(guildId: string, banner: string) {
  await db.update(guild).set({ banner, updatedAt: new Date() }).where(eq(guild.id, guildId))
}

export async function clearGuildBanner(guildId: string) {
  await db.update(guild).set({ banner: null, updatedAt: new Date() }).where(eq(guild.id, guildId))
}

export async function findGuildImage(guildId: string) {
  const [row] = await db.select({ founderId: guild.founderId, image: guild.image }).from(guild).where(eq(guild.id, guildId)).limit(1)
  return row
}

export async function updateGuildImage(guildId: string, image: string) {
  await db.update(guild).set({ image, updatedAt: new Date() }).where(eq(guild.id, guildId))
}

export async function clearGuildImage(guildId: string) {
  await db.update(guild).set({ image: null, updatedAt: new Date() }).where(eq(guild.id, guildId))
}

export async function insertGuildInvite(input: {
  id: string
  guildId: string
  createdBy: string
  token: string
  maxUses: number | null
  expiresAt: Date | null
}) {
  const [row] = await db.insert(guildInvite).values(input).returning({ token: guildInvite.token })
  return row
}

export async function findMembership(guildId: string, userId: string) {
  const [row] = await db
    .select({ guildId: guildMember.guildId })
    .from(guildMember)
    .where(and(eq(guildMember.guildId, guildId), eq(guildMember.userId, userId)))
    .limit(1)
  return row
}

export async function deleteMembership(guildId: string, userId: string) {
  await db.delete(guildMember).where(and(eq(guildMember.guildId, guildId), eq(guildMember.userId, userId)))
}

export async function findRoleByName(guildId: string, name: string) {
  const [row] = await db
    .select({ id: guildRole.id })
    .from(guildRole)
    .where(and(eq(guildRole.guildId, guildId), eq(guildRole.name, name)))
    .limit(1)
  return row
}

export async function insertGuildRole(input: { id: string; guildId: string; name: string; color: string; createdBy: string }) {
  const [row] = await db
    .insert(guildRole)
    .values(input)
    .returning({ id: guildRole.id, name: guildRole.name, color: guildRole.color })
  return row
}

export async function findMemberAvatar(guildId: string, userId: string) {
  const [row] = await db
    .select({ image: user.image })
    .from(guildMember)
    .innerJoin(user, eq(user.id, guildMember.userId))
    .where(and(eq(guildMember.guildId, guildId), eq(guildMember.userId, userId)))
    .limit(1)
  return row
}
