import { and, eq, ne, or } from "drizzle-orm"

import { db } from "@/db"
import { guild } from "@/db/schema"
import { auth } from "@/lib/auth"

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

export async function PATCH(
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
    return Response.json({ error: "Você não tem permissão para editar esta guilda. Apenas o fundador pode fazer isso." }, { status: 403 })
  }

  const formData = await request.formData()
  const name = textValue(formData, "name")
  const tag = textValue(formData, "tag").toLowerCase()
  const description = textValue(formData, "description")

  if (name.length < 2 || name.length > 80) {
    return Response.json({ error: "O nome da guilda deve ter entre 2 e 80 caracteres." }, { status: 400 })
  }
  if (!/^[a-z0-9][a-z0-9-]{0,3}$/.test(tag)) {
    return Response.json({ error: "A tag deve ter de 1 a 4 caracteres, começar com uma letra ou número e não conter espaços." }, { status: 400 })
  }
  if (description.length > 500) {
    return Response.json({ error: "A descrição da guilda deve ter no máximo 500 caracteres." }, { status: 400 })
  }

  const [conflictingGuild] = await db
    .select({ id: guild.id, name: guild.name, tag: guild.tag })
    .from(guild)
    .where(and(or(eq(guild.name, name), eq(guild.tag, tag)), ne(guild.id, guildId)))
    .limit(1)
  if (conflictingGuild?.name === name) return Response.json({ error: "Esse nome de guilda já está em uso. Escolha outro." }, { status: 409 })
  if (conflictingGuild?.tag === tag) return Response.json({ error: "Essa tag já está em uso. Escolha outra." }, { status: 409 })

  await db
    .update(guild)
    .set({ name, tag, description, updatedAt: new Date() })
    .where(eq(guild.id, guildId))

  return Response.json({ tag })
}

export async function DELETE(
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

  if (!currentGuild) return Response.json({ error: "Esta guilda não existe mais." }, { status: 404 })
  if (currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Apenas o fundador pode excluir a guilda." }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null
  if (body?.confirmation !== "Confirmar") {
    return Response.json({ error: "Digite Confirmar para excluir a guilda." }, { status: 400 })
  }

  await db.delete(guild).where(eq(guild.id, guildId))

  return Response.json({ ok: true })
}
