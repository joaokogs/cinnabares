import { and, eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { db } from "@/db"
import { guild, guildRole } from "@/db/schema"
import { auth } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const [currentGuild] = await db
    .select({ founderId: guild.founderId })
    .from(guild)
    .where(eq(guild.id, guildId))
    .limit(1)
  if (!currentGuild || currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Você não tem permissão para criar cargos. Apenas o fundador pode fazer isso." }, { status: 403 })
  }

  const body = (await request.json()) as { name?: string; color?: string }
  const name = body.name?.trim() ?? ""
  const color = body.color?.trim() || "#ff5b4f"
  if (name.length < 2 || name.length > 40) {
    return Response.json({ error: "O nome do cargo deve ter entre 2 e 40 caracteres." }, { status: 400 })
  }
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return Response.json({ error: "Escolha uma cor hexadecimal válida." }, { status: 400 })
  }

  const [existingRole] = await db
    .select({ id: guildRole.id })
    .from(guildRole)
    .where(and(eq(guildRole.guildId, guildId), eq(guildRole.name, name)))
    .limit(1)
  if (existingRole) return Response.json({ error: "Já existe um cargo com esse nome. Escolha outro." }, { status: 409 })

  const [role] = await db
    .insert(guildRole)
    .values({ id: randomUUID(), guildId, name, color, createdBy: session.user.id })
    .returning({ id: guildRole.id, name: guildRole.name, color: guildRole.color })

  return Response.json({ role })
}
