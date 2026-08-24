import { eq } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"

export async function getAdminSession(headers: Headers) {
  const session = await auth.api.getSession({ headers })

  if (!session) {
    return { session: null, response: Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 }) }
  }

  const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)

  if (account?.role !== "admin") {
    return { session: null, response: Response.json({ error: "Você não tem permissão para gerenciar torneios." }, { status: 403 }) }
  }

  return { session, response: null }
}
