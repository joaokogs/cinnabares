import { put } from "@vercel/blob"
import { and, eq, ne, or } from "drizzle-orm"

import { db } from "@/db"
import { guild } from "@/db/schema"
import { auth } from "@/lib/auth"

const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

async function uploadAsset(file: FormDataEntryValue | null, pathname: string) {
  if (!(file instanceof File) || file.size === 0) return null
  if (!allowedImageTypes.has(file.type)) throw new Error("Use uma imagem JPG, PNG ou WebP.")
  if (file.size > MAX_IMAGE_BYTES) throw new Error("A imagem deve ter no máximo 3 MB.")

  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  })
  return blob.pathname
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 })

  const { guildId } = await params
  const [currentGuild] = await db
    .select({ founderId: guild.founderId })
    .from(guild)
    .where(eq(guild.id, guildId))
    .limit(1)

  if (!currentGuild || currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Apenas o fundador pode editar esta guilda." }, { status: 403 })
  }

  const formData = await request.formData()
  const name = textValue(formData, "name")
  const tag = textValue(formData, "tag").toLowerCase()
  const description = textValue(formData, "description")

  if (name.length < 2 || name.length > 80) {
    return Response.json({ error: "O nome deve ter entre 2 e 80 caracteres." }, { status: 400 })
  }
  if (!/^[a-z0-9][a-z0-9-]{0,3}$/.test(tag)) {
    return Response.json({ error: "A tag deve ter no máximo 4 caracteres, sem espaços." }, { status: 400 })
  }
  if (description.length > 500) {
    return Response.json({ error: "A descrição deve ter no máximo 500 caracteres." }, { status: 400 })
  }

  const [conflictingGuild] = await db
    .select({ id: guild.id, name: guild.name, tag: guild.tag })
    .from(guild)
    .where(and(or(eq(guild.name, name), eq(guild.tag, tag)), ne(guild.id, guildId)))
    .limit(1)
  if (conflictingGuild?.name === name) return Response.json({ error: "Esse nome já está em uso." }, { status: 409 })
  if (conflictingGuild?.tag === tag) return Response.json({ error: "Essa tag já está em uso." }, { status: 409 })

  const file = formData.get("image")
  let image: string | null = null
  let banner: string | null = null
  try {
    ;[image, banner] = await Promise.all([
      uploadAsset(file, `guilds/${guildId}/avatar`),
      uploadAsset(formData.get("banner"), `guilds/${guildId}/banner`),
    ])
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível salvar as imagens." }, { status: 400 })
  }

  await db
    .update(guild)
    .set({ name, tag, description, ...(image ? { image } : {}), ...(banner ? { banner } : {}), updatedAt: new Date() })
    .where(eq(guild.id, guildId))

  return Response.json({ tag })
}
