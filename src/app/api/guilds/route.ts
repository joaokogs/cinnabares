import { put } from "@vercel/blob"
import { eq, or } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { db } from "@/db"
import { guild, guildMember, guildMemberRole, guildRole } from "@/db/schema"
import { auth } from "@/lib/auth"

const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

function readText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim()
}

function validateGuild(name: string, tag: string, description: string) {
  if (name.length < 2 || name.length > 80) return "O nome da guilda deve ter entre 2 e 80 caracteres."
  if (!/^[a-z0-9][a-z0-9-]{0,3}$/.test(tag)) {
    return "A tag deve ter de 1 a 4 caracteres, começar com uma letra ou número e não conter espaços."
  }
  if (description.length > 500) return "A descrição da guilda deve ter no máximo 500 caracteres."
  return null
}

async function uploadAsset(file: FormDataEntryValue | null, pathname: string) {
  if (!(file instanceof File) || file.size === 0) return null
  if (!allowedImageTypes.has(file.type)) throw new Error("Escolha uma imagem JPG, PNG ou WebP.")
  if (file.size > MAX_IMAGE_BYTES) throw new Error("A imagem deve ter no máximo 3 MB. Escolha um arquivo menor.")

  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  })
  return blob.pathname
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para criar uma guilda." }, { status: 401 })

  const formData = await request.formData()
  const name = readText(formData, "name")
  const tag = readText(formData, "tag").toLowerCase()
  const description = readText(formData, "description")
  const validationError = validateGuild(name, tag, description)

  if (validationError) return Response.json({ error: validationError }, { status: 400 })

  const [[existingGuild], [existingMembership]] = await Promise.all([
    db
      .select({ name: guild.name, tag: guild.tag })
      .from(guild)
      .where(or(eq(guild.name, name), eq(guild.tag, tag)))
      .limit(1),
    db
      .select({ guildId: guildMember.guildId })
      .from(guildMember)
      .where(eq(guildMember.userId, session.user.id))
      .limit(1),
  ])

  if (existingGuild?.name === name) return Response.json({ error: "Esse nome de guilda já está em uso. Escolha outro." }, { status: 409 })
  if (existingGuild?.tag === tag) return Response.json({ error: "Essa tag já está em uso. Escolha outra." }, { status: 409 })
  if (existingMembership) {
    return Response.json({ error: "Você já pertence a uma guilda. Saia dela antes de criar outra." }, { status: 409 })
  }

  const id = randomUUID()
  const founderRoleId = randomUUID()
  const memberRoleId = randomUUID()
  let image: string | null = null
  let banner: string | null = null

  try {
    ;[image, banner] = await Promise.all([
      uploadAsset(formData.get("image"), `guilds/${id}/avatar`),
      uploadAsset(formData.get("banner"), `guilds/${id}/banner`),
    ])
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível processar as imagens. Escolha outros arquivos e tente novamente." }, { status: 400 })
  }

  try {
    await db.batch([
      db.insert(guild).values({ id, name, tag, description, image, banner, founderId: session.user.id }),
      db.insert(guildMember).values({ guildId: id, userId: session.user.id }),
      db.insert(guildRole).values({
        id: founderRoleId,
        guildId: id,
        name: "Founder",
        position: 0,
        isDefault: false,
        createdBy: session.user.id,
      }),
      db.insert(guildMemberRole).values({ guildId: id, userId: session.user.id, roleId: founderRoleId }),
      db.insert(guildRole).values({
        id: memberRoleId,
        guildId: id,
        name: "Member",
        position: 1,
        isDefault: true,
        permissions: {},
        createdBy: session.user.id,
      }),
    ])
  } catch (error) {
    const databaseError = error as { cause?: { code?: string; constraint?: string } }
    if (databaseError.cause?.code === "23505") {
      if (databaseError.cause.constraint === "guild_member_user_unique") {
        return Response.json({ error: "Você já pertence a uma guilda. Saia dela antes de criar outra." }, { status: 409 })
      }
      if (databaseError.cause.constraint === "guild_name_unique") {
        return Response.json({ error: "Esse nome de guilda já está em uso. Escolha outro." }, { status: 409 })
      }
      if (databaseError.cause.constraint === "guild_tag_unique") {
        return Response.json({ error: "Essa tag já está em uso. Escolha outra." }, { status: 409 })
      }
    }
    return Response.json({ error: "Não foi possível criar a guilda agora. Tente novamente em instantes." }, { status: 500 })
  }

  return Response.json({ tag })
}
