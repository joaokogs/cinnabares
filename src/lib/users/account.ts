import { eq } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema"

export async function getUserRole(userId: string) {
  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1)
  return row?.role ?? null
}

export async function getUserProfile(userId: string) {
  const [row] = await db
    .select({ name: user.name, username: user.username, email: user.email, image: user.image })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return row ?? null
}

export async function getUserImage(userId: string) {
  const [row] = await db.select({ image: user.image }).from(user).where(eq(user.id, userId)).limit(1)
  return row?.image ?? null
}

export async function updateUserAvatar(userId: string, pathname: string) {
  await db.update(user).set({ image: pathname, updatedAt: new Date() }).where(eq(user.id, userId))
}