import { del, get, put } from "@vercel/blob"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { guild } from "@/db/schema"
import { auth } from "@/lib/auth"

const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

function imageProxyUrl(guildId: string, pathname: string) {
  return `/api/guilds/${guildId}/image?path=${encodeURIComponent(pathname)}`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params
  const pathname = new URL(request.url).searchParams.get("path")
  const [currentGuild] = await db
    .select({ image: guild.image })
    .from(guild)
    .where(eq(guild.id, guildId))
    .limit(1)

  if (!pathname || !currentGuild?.image || currentGuild.image !== pathname) {
    return new Response("Imagem não encontrada.", { status: 404 })
  }

  const blob = await get(pathname, { access: "private" })
  if (!blob || !blob.stream) return new Response("Imagem não encontrada.", { status: 404 })

  return new Response(blob.stream, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": blob.blob.contentType,
    },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const [currentGuild] = await db
    .select({ founderId: guild.founderId, image: guild.image })
    .from(guild)
    .where(eq(guild.id, guildId))
    .limit(1)

  if (!currentGuild || currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Você não tem permissão para editar a imagem desta guilda." }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return Response.json({ error: "Selecione uma imagem para continuar." }, { status: 400 })
  }
  if (!allowedImageTypes.has(file.type)) {
    return Response.json({ error: "Escolha uma imagem JPG, PNG ou WebP." }, { status: 400 })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "A imagem deve ter no máximo 3 MB. Escolha um arquivo menor." }, { status: 400 })
  }

  const blob = await put(`guilds/${guildId}/avatar`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  })

  await db
    .update(guild)
    .set({ image: blob.pathname, updatedAt: new Date() })
    .where(eq(guild.id, guildId))

  if (currentGuild.image) {
    await del(currentGuild.image).catch(() => {})
  }

  return Response.json({ url: imageProxyUrl(guildId, blob.pathname) })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Sua sessão expirou. Entre novamente para continuar." }, { status: 401 })

  const { guildId } = await params
  const [currentGuild] = await db
    .select({ founderId: guild.founderId, image: guild.image })
    .from(guild)
    .where(eq(guild.id, guildId))
    .limit(1)

  if (!currentGuild || currentGuild.founderId !== session.user.id) {
    return Response.json({ error: "Você não tem permissão para remover a imagem desta guilda." }, { status: 403 })
  }

  if (currentGuild.image) {
    await del(currentGuild.image).catch(() => {})
  }

  await db
    .update(guild)
    .set({ image: null, updatedAt: new Date() })
    .where(eq(guild.id, guildId))

  return Response.json({ ok: true })
}
