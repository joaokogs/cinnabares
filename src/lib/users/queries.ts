import { eq } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema"

const publicUserFields = {
  id: user.id,
  name: user.name,
  username: user.username,
  image: user.image,
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
