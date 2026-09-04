import { put } from "@vercel/blob"
import { randomUUID } from "node:crypto"

import { auth } from "@/lib/auth"
import {
  createGuild,
  findGuildByNameOrTag,
  findMembershipByUser,
  type CreateGuildInput,
} from "@/lib/guilds/repository"

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

function parseGuildForm(formData: FormData) {
  const name = readText(formData, "name")
  const tag = readText(formData, "tag").toLowerCase()
  const description = readText(formData, "description")
  const validationError = validateGuild(name, tag, description)
  if (validationError) return { error: validationError }
  return { name, tag, description }
}

function conflictResponse(
  existingGuild: { name: string; tag: string } | undefined,
  existingMembership: { guildId: string } | undefined,
  name: string,
  tag: string
) {
  if (existingGuild?.name === name) return Response.json({ error: "Esse nome de guilda já está em uso. Escolha outro." }, { status: 409 })
  if (existingGuild?.tag === tag) return Response.json({ error: "Essa tag já está em uso. Escolha outra." }, { status: 409 })
  if (existingMembership) {
    return Response.json({ error: "Você já pertence a uma guilda. Saia dela antes de criar outra." }, { status: 409 })
  }
  return null
}

async function uploadImages(formData: FormData, id: string) {
  try {
    const [image, banner] = await Promise.all([
      uploadAsset(formData.get("image"), `guilds/${id}/avatar`),
      uploadAsset(formData.get("banner"), `guilds/${id}/banner`),
    ])
    return { image, banner }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível processar as imagens. Escolha outros arquivos e tente novamente." }, { status: 400 })
  }
}

function handleCreateError(error: unknown) {
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

async function createGuildOrError(input: CreateGuildInput) {
  try {
    await createGuild(input)
    return null
  } catch (error) {
    return handleCreateError(error)
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para criar uma guilda." }, { status: 401 })

  const formData = await request.formData()
  const parsed = parseGuildForm(formData)
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 })

  const [existingGuild, existingMembership] = await Promise.all([
    findGuildByNameOrTag(parsed.name, parsed.tag),
    findMembershipByUser(session.user.id),
  ])
  const conflict = conflictResponse(existingGuild, existingMembership, parsed.name, parsed.tag)
  if (conflict) return conflict

  const [id, founderRoleId, memberRoleId] = [randomUUID(), randomUUID(), randomUUID()]
  const assets = await uploadImages(formData, id)
  if (assets instanceof Response) return assets

  const createError = await createGuildOrError({
    id,
    name: parsed.name,
    tag: parsed.tag,
    description: parsed.description,
    image: assets.image,
    banner: assets.banner,
    founderId: session.user.id,
    founderRoleId,
    memberRoleId,
  })
  if (createError) return createError

  return Response.json({ tag: parsed.tag })
}
